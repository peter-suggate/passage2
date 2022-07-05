import { createService } from "./createService";
import {
  ActionDefinitions,
  ApplyTransitionResult,
  FinalStateDefinition,
  FsmEvent,
  FsmMachine,
  FsmService,
  ServiceDefinition,
  ServiceDefinitions,
  ServiceInvocation,
  SpawnedService,
  StateDefinitions,
  TransitionEvent,
} from "./fsm-types";

const executeAction =
  <Actions extends ActionDefinitions<Actions, Context>, Context extends object>(
    actionDefinitions: ActionDefinitions<Actions, Context>,
    context: Context,
    event: FsmEvent
  ) =>
  (action: keyof Actions) => {
    const newContext = actionDefinitions[action](context, event);

    return { ...context, ...newContext };
  };

export const executeActions = <Actions, Context extends object>(
  actions: (keyof Actions)[],
  actionDefinitions: ActionDefinitions<Actions, Context>,
  context: Context,
  event: FsmEvent
) => {
  let resultContext = { ...context };

  const executer = executeAction(actionDefinitions, context, event);

  actions.forEach((action) => {
    const contextUpdates = executer(action);

    if (contextUpdates) resultContext = { ...resultContext, ...contextUpdates };
  });

  return resultContext;
};

const invokeService = <States extends object, Services, Actions, Context>(
  invocation: ServiceInvocation<States, Services, Actions, Context>,
  serviceDefinition: ServiceDefinition<States, Services, Actions, Context>,
  context: Context,
  event: FsmEvent,
  onSendEvent: (event: TransitionEvent<States, Actions>) => void
) => {
  const spawnedService = {
    status: "pending",
    id: invocation.src,
  } as SpawnedService;

  if (typeof serviceDefinition === "function") {
    spawnedService.promise = serviceDefinition(context, event)
      .then((value) => {
        spawnedService.status = "settled";

        invocation.onDone &&
          onSendEvent({ type: "onDone", ...invocation.onDone, value });
      })
      .catch((error) => {
        spawnedService.status = "settled";
        invocation.onError &&
          onSendEvent({ type: "onError", ...invocation.onError, value: error });
      });
  } else {
    spawnedService.promise = new Promise((resolve, reject) => {
      const machine = serviceDefinition;

      const childService = createService(machine);
      spawnedService.service = childService;

      const disposer = childService.subscribe(() => {
        const finalState = Object.keys(machine.states).find(
          (state) => machine.states[state].type === "final"
        );
        if (!finalState) {
          throw new Error(
            "Machine has no final state and therefore cannot be exited."
          );
        }

        if (childService.currentState.value === finalState) {
          let valueReturnedFromChild = getAnyFinalStateDataValue(
            childService,
            finalState
          );

          spawnedService.status = "settled";

          // TODO if the final state has a data() func we call it (passing in context and event?)
          // and pass resulting data as value to onSendEvent somehow..
          invocation.onDone &&
            onSendEvent({
              type: "onDone",
              ...invocation.onDone,
              value: valueReturnedFromChild,
            });

          resolve(childService.currentState);

          disposer();
        }

        // TODO handle onError. How?
      });

      childService.start();
    });
  }

  return spawnedService;
};

const invokeServices = <States extends object, Services, Actions, Context>(
  invocations: ServiceInvocation<States, Services, Actions, Context>[],
  serviceDefinitions: ServiceDefinitions<States, Services, Actions, Context>,
  context: Context,
  event: FsmEvent,
  onSendEvent: (event: TransitionEvent<States, Actions>) => void
) => {
  return invocations.map((invocation) =>
    invokeService(
      invocation,
      serviceDefinitions[invocation.src],
      context,
      event,
      onSendEvent
    )
  );
};

export const applyEffects =
  <
    States extends StateDefinitions<States, Services, Actions, Context>,
    InitialState extends keyof States,
    Services extends ServiceDefinitions<States, Services, Actions, Context>,
    Actions extends ActionDefinitions<Actions, Context>,
    Context extends object
  >(
    machine: FsmMachine<States, InitialState, Services, Actions, Context>
  ) =>
  (
    state: ApplyTransitionResult<States, Services, Actions, Context>,
    context: Context,
    event: FsmEvent,
    onSendEvent: (event: TransitionEvent<States, Actions>) => void
  ) => {
    const updatedContext = executeActions(
      state.actions,
      machine.actions,
      context,
      event
    );

    const spawnedServices = invokeServices<States, Services, Actions, Context>(
      state.services,
      machine.services,
      updatedContext,
      event,
      onSendEvent
    );

    return {
      value: state.value,
      spawnedServices,
      context: updatedContext,
    };
  };

const getAnyFinalStateDataValue = <
  States extends object,
  Services,
  Actions,
  Context
>(
  childService: FsmService<any, any, any, any, any>,
  finalState: string
) => {
  const finalStateDefinition = childService.machine.states[
    finalState
  ] as FinalStateDefinition<States, Services, Actions, Context>;

  let valueReturnedFromChild = undefined;
  if (finalStateDefinition.data) {
    const finalAction = childService.machine.actions[finalStateDefinition.data];
    valueReturnedFromChild = finalAction(childService.currentState.context, {
      type: "data",
    });
  }
  return valueReturnedFromChild;
};
