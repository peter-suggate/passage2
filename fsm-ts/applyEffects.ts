import { createService } from "./createService";
import {
  ActionDefinitions,
  ApplyTransitionResult,
  FsmEvent,
  FsmMachine,
  ServiceDefinition,
  ServiceDefinitions,
  ServiceInvocation,
  SpawnedService,
  StateDefinitions,
  TransitionEvent,
} from "./fsm-types";

const executeAction =
  <
    States,
    Actions extends ActionDefinitions<States, Actions, Context>,
    Context
  >(
    actionDefinitions: ActionDefinitions<States, Actions, Context>,
    context: Context,
    event: FsmEvent<States, Actions>
  ) =>
  (action: keyof Actions) => {
    const newContext = actionDefinitions[action](context, event);

    return { ...context, ...newContext };
  };

export const executeActions = <States, Actions, Context>(
  actions: (keyof Actions)[],
  actionDefinitions: ActionDefinitions<States, Actions, Context>,
  context: Context,
  event: FsmEvent<States, Actions>
) => {
  let resultContext = { ...context };

  const executer = executeAction(actionDefinitions, context, event);

  actions.forEach((action) => {
    const contextUpdates = executer(action);

    if (contextUpdates) resultContext = { ...resultContext, ...contextUpdates };
  });

  return resultContext;
};

const invokeService = <States, Services, Actions, Context>(
  invocation: ServiceInvocation<States, Services, Actions, Context>,
  serviceDefinition: ServiceDefinition<States, Services, Actions, Context>,
  context: Context,
  event: FsmEvent<States, Actions>,
  onSendEvent: (event: TransitionEvent<States, Actions>) => void
) => {
  const spawnedService = {
    status: "pending",
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

      const service = createService(machine);
      spawnedService.service = service;

      const disposer = service.subscribe(() => {
        const finalState = Object.keys(machine.states).find(
          (state) => machine.states[state].type === "final"
        );
        if (!finalState) {
          throw new Error(
            "Machine has no final state and therefore cannot be exited."
          );
        }

        if (service.currentState.value === finalState) {
          spawnedService.status = "settled";

          invocation.onDone &&
            onSendEvent({ type: "onDone", ...invocation.onDone });

          resolve(service.currentState);

          disposer();
        }
      });

      service.start();
    });
  }

  return spawnedService;
};

const invokeServices = <States, Services, Actions, Context>(
  invocations: ServiceInvocation<States, Services, Actions, Context>[],
  serviceDefinitions: ServiceDefinitions<States, Services, Actions, Context>,
  context: Context,
  event: FsmEvent<States, Actions>,
  onSendEvent: (event: TransitionEvent<States, Actions>) => void
) => {
  return invocations.map((invocation) =>
    invokeService(
      invocation,
      serviceDefinitions[invocation.serviceId],
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
    Actions extends ActionDefinitions<States, Actions, Context>,
    Context extends object
  >(
    machine: FsmMachine<States, InitialState, Services, Actions, Context>
  ) =>
  (
    state: ApplyTransitionResult<States, Services, Actions, Context>,
    context: Context,
    event: FsmEvent<States, Actions>,
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
