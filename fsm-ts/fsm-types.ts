import { KeyOf } from "./fsm-core-types";

export type Transition<States extends object, Actions, Value = any> = {
  target: KeyOf<States>;
  value: Value;
  actions: (keyof Actions)[];
};

export type TransitionEvent<States extends object, Actions> = {
  type: string;
} & Transition<States, Actions>;

export type FsmEvent = { type: string; value?: any };

export type FsmEventHandler = (event: FsmEvent) => void;

export type ServiceInvocation<
  States extends object,
  Services,
  Actions,
  Context
> = {
  src: keyof Services;
  onDone: Transition<States, Actions>;
  onError: Transition<States, Actions>;
};

type StateDefinitionBase<States extends object, Services, Actions, Context> = {
  entry?: keyof Actions;
  exit?: keyof Actions;
  invoke?: ServiceInvocation<States, Services, Actions, Context>;
};

export type AnyStateDefinition = StateDefinition<any, any, any, any>;

export type TransitionStateDefinition<
  States extends object,
  Services,
  Actions,
  Context
> = {
  type?: "transition";
  on?: { [transition: string]: Transition<States, Actions> };
} & StateDefinitionBase<States, Services, Actions, Context>;

export type AnyTransitionStateDefinition = TransitionStateDefinition<
  any,
  any,
  any,
  any
>;

export type FinalStateDefinition<
  States extends object,
  Services,
  Actions,
  Context
> = {
  type: "final";
  data?: keyof Actions;
} & StateDefinitionBase<States, Services, Actions, Context>;

export type StateDefinition<
  States extends object,
  Services,
  Actions,
  Context
> =
  | FinalStateDefinition<States, Services, Actions, Context>
  | TransitionStateDefinition<States, Services, Actions, Context>;

export type StateDefinitions<
  States extends object,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions,
  Context
> = {
  [S in keyof States]: StateDefinition<States, Services, Actions, Context>;
};

export type MachineServiceDefinition = FsmMachine<any, any, any, any, any>;

export type PromiseServiceDefinition<Context> = (
  context: Context,
  event: FsmEvent
) => Promise<unknown>;

export type ServiceDefinition<Context> =
  | PromiseServiceDefinition<Context>
  | MachineServiceDefinition;

export type ServiceDefinitions<States, Services, Actions, Context> = {
  [S in keyof Services]: ServiceDefinition<Context>;
};

export type ActionDefinitions<Actions, Context extends object = object> = {
  [A in keyof Actions]: (context: Context, event: FsmEvent) => Partial<Context>;
};

export type FsmMachine<
  States extends StateDefinitions<States, Services, Actions, Context>,
  InitialState extends keyof States,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends object
> = {
  id: string;
  initial: InitialState;
  states: StateDefinitions<States, Services, Actions, Context>;
  services: ServiceDefinitions<States, Services, Actions, Context>;
  actions: ActionDefinitions<Actions, Context>;
  context: Context;
};

export type AnyMachine = FsmMachine<any, any, any, any, any>;

// type FsmOptions = {
//   States?: StateDefinitions<States, Services, Actions, Context>,
// // States extends StateDefinitions<States, Services, Actions, Context>,
// Services?: ServiceDefinitions<States, Services, Actions, Context>,
// Actions?: ActionDefinitions<Actions, Context>,
// Context?: object
// }
