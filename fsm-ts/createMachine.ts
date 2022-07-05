import { generateUUID } from "./fsm-core-util";
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
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends object
>(
  options: DeepPartial<
    FsmMachine<States, InitialState, Services, Actions, Context>
  >
) => {
  if (!options.initial) {
    throw new Error(
      "No initial state defined. Expecting:\n{\n  initial: 'state'\n  ...\n}\n"
    );
  }

  const result = {
    id: generateUUID(),
    services: {} as ServiceDefinitions<States, Services, Actions, Context>,
    ...options,
  };

  return result as FsmMachine<States, InitialState, Services, Actions, Context>;
};
