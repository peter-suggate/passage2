import {
  FsmOptions,
  MachineServiceDefinition,
  ServiceDefinition,
  StateDefinition,
  TransitionStateDefinition,
} from "./fsm-types";

export const stateHasTransitions = <Options extends FsmOptions>(
  state: StateDefinition<
    Options["States"],
    Options["Services"],
    Options["Actions"],
    Options["Context"]
  >
): state is TransitionStateDefinition<
  Options["States"],
  Options["Services"],
  Options["Actions"],
  Options["Context"]
> => {
  return state.type !== "final";
};

export const isMachineService = <Options>(
  service: ServiceDefinition<Options>
): service is MachineServiceDefinition => {
  return typeof service !== "function";
};
