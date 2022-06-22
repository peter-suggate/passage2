import {
  ActionDefinitions,
  ApplyTransitionResult,
  FsmMachine,
  ServiceDefinitions,
  StateDefinition,
  StateDefinitions,
  Transition,
} from "./fsm-types";

const lookupTransition = <
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<States, Actions, Context>,
  Context
>(
  state: StateDefinition<States, Services, Actions, Context>,
  transitionName: string
): Transition<States, Actions> => {
  if (transitionName === "onDone" && state.invoke?.onDone) {
    return state.invoke.onDone;
  } else if (transitionName === "onError" && state.invoke?.onError) {
    return state.invoke.onError;
  } else if (state.on && Object.keys(state.on).includes(transitionName)) {
    return state.on[transitionName];
  }

  throw Error(
    `No transition: ${transitionName} found on state: ${JSON.stringify(state)}`
  );
};

export const applyTransition =
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
    state?: keyof States,
    transitionName?: string
  ): ApplyTransitionResult<States, Services, Actions, Context> => {
    if (!state || !transitionName) {
      // Uninitialized state.
      const stateDefinition = machine.states[machine.initial];

      return {
        value: machine.initial,
        actions: stateDefinition.entry ? [stateDefinition.entry] : [],
        services: stateDefinition.invoke ? [stateDefinition.invoke] : [],
      };
    }

    const currentState = machine.states[state];

    const transition = lookupTransition<States, Services, Actions, Context>(
      currentState,
      transitionName
    );
    const { target, actions: transitionActions } = transition;

    const newState = machine.states[target];

    // Build a list of fire-and-forget actions that are executed during the transition.
    const actions: (keyof Actions)[] = [];

    currentState.exit && actions.push(currentState.exit);
    transitionActions && actions.push(...transitionActions);
    newState.entry && actions.push(newState.entry);

    const services = [];
    newState.invoke && services.push(newState.invoke);

    return { value: target, actions, services };
  };
