import { KeyOf } from "./fsm-core-types";
import { generateUUID } from "./fsm-core-util";
import {
  ActionDefinitions,
  CreateFsmOptions,
  FsmMachine,
  FsmOptions,
  ServiceDefinitions,
  StateDefinitions,
} from "./fsm-types";

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export const createMachine = <
  Context extends object,
  States extends StateDefinitions<States, Services, Actions, Context> = any,
  Services extends ServiceDefinitions<Services, Context> = any,
  Actions extends ActionDefinitions<Actions, Context> = any
>({
  id,
  states,
  initial,
  services = {} as Services,
  actions = {} as Actions,
  context = {} as Context,
}: {
  id?: string;
  states: DeepPartial<States>;
  initial: KeyOf<States>;
  services?: Services;
  actions?: Actions;
  context?: Context;
}) =>
  // options: DeepPartial<
  //   FsmMachine<CreateFsmOptions<States, Services, Actions, Context>>
  // >
  {
    type Options = CreateFsmOptions<States, Services, Actions, Context>;

    const result = {
      id: id || generateUUID(),
      states,
      initial,
      services,
      actions,
      context,
    } as FsmMachine<Options>;

    return result;
  };
