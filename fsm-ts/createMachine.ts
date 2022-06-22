import {
  ActionDefinitions,
  FsmMachine,
  ServiceDefinitions,
  StateDefinitions,
} from "./fsm-types";

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export const createMachine = <
  States extends StateDefinitions<States, Services, Actions, Context>,
  InitialState extends keyof States,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<States, Actions, Context>,
  Context extends object
>(
  options: DeepPartial<
    FsmMachine<States, InitialState, Services, Actions, Context>
  >
) => {
  const result = {
    ...options,
  };

  return result as FsmMachine<States, InitialState, Services, Actions, Context>;
};
