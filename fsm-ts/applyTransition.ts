import { KeyOf } from "./fsm-core-types";
import { ApplyTransitionResult } from "./fsm-service-types";
import { stateHasTransitions } from "./fsm-type-guards";
import {
  ActionDefinitions,
  FsmMachine,
  FsmOptions,
  ServiceDefinitions,
  StateDefinition,
  StateDefinitions,
  Transition,
} from "./fsm-types";

const lookupTransition = <Options extends FsmOptions>(
  state: StateDefinition<
    Options["States"],
    Options["Services"],
    Options["Actions"],
    Options["Context"]
  >,
  transitionName: string
): Transition<
  Options["States"],
  Options["Services"],
  Options["Actions"],
  Options["Context"]
> => {
  if (!stateHasTransitions(state)) throw new Error("TODO handle me");

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
  <Options extends FsmOptions>(machine: FsmMachine<Options>) =>
  (
    state?: keyof Options["States"],
    transitionName?: string | null
  ): ApplyTransitionResult<Options> => {
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
    if (!stateHasTransitions<Options>(currentState))
      throw new Error("TODO handle me");

    const transition = lookupTransition<Options>(currentState, transitionName);
    const { target, actions: transitionActions } = transition;

    const newState = machine.states[target];

    // Build a list of fire-and-forget actions that are executed during the transition.
    const actions: (keyof Options["Actions"])[] = [];

    currentState.exit && actions.push(currentState.exit);
    transitionActions && actions.push(...transitionActions);
    newState.entry && actions.push(newState.entry);

    const services = [];
    newState.invoke && services.push(newState.invoke);

    return { value: target, actions, services };
  };
