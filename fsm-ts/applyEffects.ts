import {
  ActionDefinitions,
  ApplyTransitionResult,
  FsmEvent,
  FsmMachine,
  ServiceDefinition,
  ServiceDefinitions,
  ServiceInvocation,
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

const invokeService = async <States, Services, Actions, Context>(
  invocation: ServiceInvocation<States, Services, Actions, Context>,
  service: ServiceDefinition<States, Services, Actions, Context>,
  context: Context,
  event: FsmEvent<States, Actions>,
  onSendEvent: (event: TransitionEvent<States, Actions>) => void
) => {
  if (typeof service === "function") {
    return service(context, event)
      .then((result) => {
        invocation.onDone &&
          onSendEvent({ type: "onDone", ...invocation.onDone });
      })
      .catch((error) => {
        invocation.onError &&
          onSendEvent({ type: "onError", ...invocation.onError });
      });
  } else throw Error("TODO implement me (machine case)");
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
      serviceDefinitions[invocation.id],
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
