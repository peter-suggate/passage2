import { DeepReadonly, KeyOf } from "./fsm-core-types";
import { ApplyTransitionResult } from "./fsm-system-types";
import { machineStateDefinition, stateHasTransitions } from "./fsm-transforms";
import {
  FsmMachine,
  FsmOptions,
  StateDefinitionForOptions,
  TransitionDefinitionForOptions,
} from "./fsm-types";

const lookupTransition = <Options extends FsmOptions>(
  state: DeepReadonly<StateDefinitionForOptions<Options>>,
  transitionName: string
): DeepReadonly<TransitionDefinitionForOptions<Options>> => {
  if (
    !stateHasTransitions(state, {
      includeInvokeTransitions: true,
      includeOnTransitions: true,
    })
  )
    throw new Error("TODO handle me");

  if (transitionName === "onDone" && state.invoke?.onDone) {
    return state.invoke.onDone;
  } else if (transitionName === "onError" && state.invoke?.onError) {
    return state.invoke.onError;
  } else if (
    state.type !== "final" &&
    state.on &&
    Object.keys(state.on).includes(transitionName)
  ) {
    return state.on[transitionName];
  }

  throw Error(
    `No transition: ${transitionName} found on state: ${JSON.stringify(state)}`
  );
};

export const applyTransition =
  <Options extends FsmOptions>(machine: FsmMachine<Options>) =>
  (
    state?: DeepReadonly<KeyOf<Options["States"]>>,
    transitionName?: string | null
  ): ApplyTransitionResult<Options> => {
    if (!state || !transitionName) {
      // Uninitialized state.
      const stateDefinition = machineStateDefinition(machine, machine.initial);

      return {
        value: machine.initial,
        actions: stateDefinition.entry ? [stateDefinition.entry] : [],
        services: stateDefinition.invoke ? [stateDefinition.invoke] : [],
      };
    }

    const currentState = machineStateDefinition(machine, state);
    if (
      !stateHasTransitions(currentState, {
        includeOnTransitions: true,
        includeInvokeTransitions: true,
      })
    )
      throw new Error("TODO handle me: " + JSON.stringify(currentState));

    const transition = lookupTransition<Options>(currentState, transitionName);
    const { target, actions: transitionActions } = transition;

    const newState = machine.states[target] as DeepReadonly<
      StateDefinitionForOptions<Options>
    >;

    // Build a list of fire-and-forget actions that are executed during the transition.
    const actions: DeepReadonly<KeyOf<Options["Actions"]>>[] = [];

    currentState.exit && actions.push(currentState.exit);
    transitionActions && actions.push(...transitionActions);
    newState.entry && actions.push(newState.entry);

    const services = [];
    newState.invoke && services.push(newState.invoke);

    return { value: target, actions, services };
  };
