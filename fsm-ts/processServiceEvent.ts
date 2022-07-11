import { applyTransition } from "./applyTransition";
import { KeyOf } from "./fsm-core-types";
import { generateId } from "./fsm-core-util";
import type {
  AnyService,
  AnyState,
  FsmService,
  FsmServiceEvent,
  FsmState,
} from "./fsm-service-types";
import type {
  ActionDefinitions,
  FsmEvent,
  FsmOptions,
  ServiceDefinitions,
  StateDefinitions,
} from "./fsm-types";
import { invokeService } from "./invokeService";

const executeAction =
  <Options extends FsmOptions>(
    actionDefinitions: Options["Actions"],
    context: Options["Context"],
    event: FsmEvent
  ) =>
  (action: keyof Options["Actions"]) => {
    const newContext = actionDefinitions[action](context, event);

    return { ...context, ...newContext };
  };

const updateServiceState = <Options extends FsmOptions>(
  service: FsmService<Options>,
  updates: Partial<FsmState<Options>>
) => {
  service.currentState = {
    ...service.currentState,
    ...updates,
  };

  service.resubscribeToSpawnedServices();
};

export const processServiceEvent = <Options extends FsmOptions>(
  service: FsmService<Options>,
  event: FsmServiceEvent<Options>,
  enqueueEvent: (event: FsmServiceEvent<Options>) => void
) => {
  const { currentState, machine } = service;

  switch (event.type) {
    case "transition": {
      const { name } = event;

      const transitionResult = applyTransition(service.machine)(
        currentState.value,
        name
      );

      transitionResult.actions.length &&
        enqueueEvent({
          type: "execute actions",
          actions: transitionResult.actions,
          event,
        });

      name !== null &&
        enqueueEvent({
          type: "exiting state",
          value: currentState.value,
        });

      enqueueEvent({ type: "entering state", value: transitionResult.value });

      transitionResult.services
        .map(
          (invocation) =>
            ({ type: "invoke service", invocation } as FsmServiceEvent<Options>)
        )
        .map(enqueueEvent);

      break;
    }
    case "exiting state": {
      break;
    }
    case "entering state": {
      enqueueEvent({
        type: "transitioned to new state",
        newState: {
          ...currentState,
          value: event.value,
        },
        prevState: currentState,
      });
      break;
    }
    case "transitioned to new state": {
      const { newState } = event;

      updateServiceState(service, newState);

      break;
    }
    case "execute actions": {
      const { actions } = event;

      let resultContext = { ...currentState.context };

      const executer = executeAction(
        service.machine.actions,
        resultContext,
        event.event
      );

      actions.forEach((action) => {
        const contextUpdates = executer(action);

        if (contextUpdates)
          resultContext = { ...resultContext, ...contextUpdates };
      });

      updateServiceState(service, { context: resultContext });
      break;
    }
    case "invoke service": {
      const { invocation } = event;

      enqueueEvent({
        type: "service created",
        id: generateId(invocation.src as string),
        invocation,
      });
      break;
    }
    case "service created": {
      const { id, invocation } = event;

      // const descriptor: PendingService = {
      //   status: "pending",
      //   service: undefined,
      //   promise: undefined
      // } as unknown as PendingService;

      // const updatedDescriptor = { ...descriptor };

      const definition =
        machine.services[invocation.src as KeyOf<Options["Services"]>];

      const descriptor = invokeService(
        service,
        currentState,
        id,
        definition,
        invocation,
        event,
        enqueueEvent
      );

      enqueueEvent({
        type: "service started",
        id,
        descriptor,
      });

      break;
    }
    case "service started": {
      const { id, descriptor } = event;

      updateServiceState(service, {
        spawnedServices: {
          ...currentState.spawnedServices,
          [id]: { ...descriptor, status: "not started" },
        },
      });

      break;
    }
    case "service finished": {
      const { id } = event;

      updateServiceState(service, {
        spawnedServices: {
          ...currentState.spawnedServices,
          [id]: { ...currentState.spawnedServices[id], status: "settled" },
        },
      });

      break;
    }
    default:
      throw Error("Unprocessed event: " + JSON.stringify(event));
  }
};
