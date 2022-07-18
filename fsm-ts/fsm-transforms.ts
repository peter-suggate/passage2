import { AnyState } from "./fsm-service-types";
import { isMachineService, stateHasTransitions } from "./fsm-type-guards";
import {
  AnyMachine,
  AnyTransitionStateDefinition,
  MachineServiceDefinition,
} from "./fsm-types";

export const stateTransitions = (
  id: AnyState["value"],
  state: AnyTransitionStateDefinition,
  invokeOnly?: boolean
) => {
  const transitionState = state as AnyTransitionStateDefinition;

  const transitions = [];

  if (invokeOnly && transitionState.invoke?.onDone) {
    transitions.push({
      name: `onDone`,
      source: id,
      target: transitionState.invoke?.onDone.target,
    });
  }
  if (invokeOnly && transitionState.invoke?.onError) {
    transitions.push({
      name: `onError`,
      source: id,
      target: transitionState.invoke?.onError.target,
    });
  }

  if (invokeOnly) return transitions;

  return [
    ...transitions,
    ...Object.entries(transitionState.on || {}).map(([name, transition]) => ({
      name,
      source: id,
      target: transition.target,
    })),
  ];
};

export const machineTransitions = (machine: AnyMachine, invokeOnly?: boolean) =>
  Object.entries(machine.states)
    .filter(
      (entry) =>
        stateHasTransitions(entry[1]) && (entry[1].on || entry[1].invoke)
    )
    .flatMap(([id, state]) =>
      stateTransitions(id, state as AnyTransitionStateDefinition, invokeOnly)
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
