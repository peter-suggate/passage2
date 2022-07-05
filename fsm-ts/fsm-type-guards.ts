import {
  MachineServiceDefinition,
  ServiceDefinition,
  ServiceDefinitions,
  StateDefinition,
  TransitionStateDefinition,
} from "./fsm-types";

export const stateHasTransitions = <
  States extends object,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions,
  Context
>(
  state: StateDefinition<States, Services, Actions, Context>
): state is TransitionStateDefinition<States, Services, Actions, Context> => {
  return state.type !== "final";
};

export const isMachineService = <States, Services, Actions, Context>(
  service: ServiceDefinition<States, Services, Actions, Context>
): service is MachineServiceDefinition => {
  return typeof service !== "function";
};
