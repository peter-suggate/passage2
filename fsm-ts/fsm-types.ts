import { KeyOf } from "./fsm-core-types";

// export type FsmOptions<Options extends FsmOptions<Options, States>, States extends StateDefinitions<States, Options['Services'], Options['Actions'], Options['Context']>> = {
//   States: States;
//   InitialState: Options["InitialState"];
//   Services: ServiceDefinitions<Options["Services"], Options["Context"]>; //Options["Services"];
//   Actions: ActionDefinitions<Options["Actions"], Options["Context"]>; //Options["Actions"];
//   Context: object; //Options["Context"];
// };

export type FsmOptions = {
  States: StateDefinitions<any, any, any, any>;
  // InitialState: any;
  Services: ServiceDefinitions<any, any>;
  Actions: ActionDefinitions<any, any>;
  Context: ContextDefinition;
};

export type ContextDefinition = object;

export type CreateFsmOptions<
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<Services, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends ContextDefinition
> = {
  States: States;
  InitialState: KeyOf<States>;
  Services: Services;
  Actions: Actions;
  Context: Context;
};

export type Transition<
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<Services, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends ContextDefinition,
  Value = any
> = {
  target: KeyOf<States>;
  value: Value;
  actions: (keyof Actions)[];
};

export type TransitionEvent<Options extends FsmOptions> = {
  type: string;
} & Transition<
  Options["States"],
  Options["Services"],
  Options["Actions"],
  Options["Context"]
>;

export type FsmEvent = { type: string; value?: any };

export type FsmEventHandler = (event: FsmEvent) => void;

export type ServiceInvocation<
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<Services, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends ContextDefinition
> = {
  src: keyof Services;
  onDone: Transition<States, Services, Actions, Context>;
  onError: Transition<States, Services, Actions, Context>;
};

type StateDefinitionBase<
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<Services, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends ContextDefinition
> = {
  entry?: KeyOf<Actions>;
  exit?: keyof Actions;
  invoke?: ServiceInvocation<States, Services, Actions, Context>;
};

export type AnyStateDefinition = StateDefinition<any, any, any, any>;

export type AnyOptions = {
  Actions: any;
  Context: any;
  InitialState: any;
  Services: any;
  States: any;
};

export type TransitionStateDefinition<
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<Services, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends ContextDefinition
> = {
  type?: "transition";
  on?: { [transition: string]: Transition<States, Services, Actions, Context> };
} & StateDefinitionBase<States, Services, Actions, Context>;

export type AnyTransitionStateDefinition = TransitionStateDefinition<
  any,
  any,
  any,
  any
>;

export type FinalStateDefinition<
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<Services, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends ContextDefinition
> = {
  type: "final";
  data?: keyof Actions;
} & StateDefinitionBase<States, Services, Actions, Context>;

export type StateDefinition<
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<Services, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends ContextDefinition
> =
  | FinalStateDefinition<States, Services, Actions, Context>
  | TransitionStateDefinition<States, Services, Actions, Context>;

export type StateDefinitionForOptions<Options extends FsmOptions> =
  StateDefinition<
    Options["States"],
    Options["Services"],
    Options["Actions"],
    Options["Context"]
  >;

export type StateDefinitions<
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<Services, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends ContextDefinition
> = {
  [S in keyof States]: StateDefinition<States, Services, Actions, Context>;
};

export type MachineServiceDefinition = FsmMachine<AnyOptions>;

export type PromiseServiceDefinition<Context> = (
  context: Context,
  event: FsmEvent
) => Promise<unknown>;

export type ServiceDefinition<Context> =
  | PromiseServiceDefinition<Context>
  | MachineServiceDefinition;

export type ServiceDefinitions<Services, Context> = {
  [S in keyof Services]: ServiceDefinition<Context>;
};

export type ActionDefinitions<
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends ContextDefinition
> = {
  [A in keyof Actions]: (context: Context, event: FsmEvent) => Partial<Context>;
};

export type FsmMachine<Options extends FsmOptions> = {
  id: string;
  initial: KeyOf<Options["States"]>;
  states: Options["States"];
  services: Options["Services"];
  actions: Options["Actions"];
  context: Options["Context"];
};

export type AnyMachine = FsmMachine<AnyOptions>;
