import { DeepReadonly } from "./fsm-core-types";
import { AnyState } from "./fsm-system-types";
import { isMachineService } from "./fsm-type-guards";
import {
  AnyMachine,
  AnyStateDefinition,
  AnyTransitionStateDefinition,
  FsmMachine,
  FsmOptions,
  MachineServiceDefinition,
  StateDefinitionForOptions,
} from "./fsm-types";

type TransitionOptions = {
  includeInvokeTransitions?: boolean;
  includeOnTransitions?: boolean;
};

export const stateHasTransitions = (
  state: DeepReadonly<AnyStateDefinition>,
  options: TransitionOptions
) =>
  !!(
    (options.includeInvokeTransitions && state.invoke) ||
    (options.includeOnTransitions &&
      state.type !== "final" &&
      Object.keys(state.on || {}).length)
  );

export const stateTransitionDefinitions = (
  state: DeepReadonly<AnyStateDefinition>,
  options: TransitionOptions
) => {
  const transitionState = state as AnyTransitionStateDefinition;

  const transitions = [];

  if (options.includeInvokeTransitions && transitionState.invoke?.onDone) {
    transitions.push("onDone");
  }
  if (options.includeInvokeTransitions && transitionState.invoke?.onError) {
    transitions.push("onError");
  }

  if (!options.includeOnTransitions) return transitions;

  return [
    ...transitions,
    ...Object.entries(transitionState.on || {}).map(
      ([name, transition]) => name
    ),
  ];
};

export const stateTransitions = (
  id: AnyState["value"],
  state: DeepReadonly<AnyStateDefinition>,
  options: TransitionOptions
) => {
  const transitionState = state as AnyTransitionStateDefinition;

  const transitions = [];

  if (options.includeInvokeTransitions && transitionState.invoke?.onDone) {
    transitions.push({
      name: `onDone`,
      source: id,
      target: transitionState.invoke?.onDone.target,
    });
  }
  if (options.includeInvokeTransitions && transitionState.invoke?.onError) {
    transitions.push({
      name: `onError`,
      source: id,
      target: transitionState.invoke?.onError.target,
    });
  }

  if (!options.includeOnTransitions) return transitions;

  return [
    ...transitions,
    ...Object.entries(transitionState.on || {}).map(([name, transition]) => ({
      name,
      source: id,
      target: transition.target,
    })),
  ];
};

export const machineTransitions = (
  machine: AnyMachine,
  options: TransitionOptions & {
    state?: string;
  }
) =>
  Object.entries(machine.states)
    .filter(
      (entry) =>
        stateHasTransitions(entry[1], {
          includeOnTransitions: true,
        }) &&
        ((entry[1].type !== "final" && entry[1].on) || entry[1].invoke) &&
        (!options.state || options.state === entry[0])
    )
    .flatMap(([id, state]) =>
      stateTransitions(id, state as AnyTransitionStateDefinition, options)
    );

export const machineFinalState = (machine: AnyMachine, invokeOnly?: boolean) =>
  Object.keys(machine.states).find(
    (state) => machine.states[state].type === "final"
  );

export const invokableMachineForState = (
  machine: AnyMachine,
  state: string
) => {
  const stateDefn = machine.states[state];

  const invokableMachine = machine.services[stateDefn.invoke?.src as string];
  return isMachineService(invokableMachine) ? invokableMachine : undefined;
};

export const invokableChildMachines = (
  machine: AnyMachine
): MachineServiceDefinition[] => {
  return Object.keys(machine.states)
    .map((state) => invokableMachineForState(machine, state))
    .filter((maybe) => !!maybe) as MachineServiceDefinition[];
};

export const machineStateDefinition = <Options extends FsmOptions>(
  machine: FsmMachine<Options>,
  state: typeof machine["initial"]
) => machine.states[state] as DeepReadonly<StateDefinitionForOptions<Options>>;
