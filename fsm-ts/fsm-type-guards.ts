import { DeepReadonly } from "./fsm-core-types";
import {
  FsmOptions,
  MachineServiceDefinition,
  ServiceDefinition,
  StateDefinitionForOptions,
  TransitionStateDefinition,
} from "./fsm-types";

export const stateHasTransitions = <Options extends FsmOptions>(
  state: DeepReadonly<StateDefinitionForOptions<Options>>
): state is DeepReadonly<
  TransitionStateDefinition<
    Options["States"],
    Options["Services"],
    Options["Actions"],
    Options["Context"]
  >
> => {
  return state.type !== "final";
};

export const isMachineService = <Options>(
  service: ServiceDefinition<Options>
): service is MachineServiceDefinition => {
  return typeof service !== "function";
};
