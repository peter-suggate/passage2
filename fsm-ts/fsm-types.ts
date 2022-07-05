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

export type ServiceDefinition<States, Services, Actions, Context> =
  | ((context: Context, event: FsmEvent) => Promise<unknown>)
  | MachineServiceDefinition;

export type ServiceDefinitions<States, Services, Actions, Context> = {
  [S in keyof Services]: ServiceDefinition<States, Services, Actions, Context>;
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

export type FsmServiceEvent = {
  type: "state updated";
  prevState: FsmState<any, any, any, any>;
  newState: FsmState<any, any, any, any>;
};

export type FsmListener = (e: FsmServiceEvent) => void;

export type FsmService<
  States extends StateDefinitions<States, Services, Actions, Context>,
  InitialState extends keyof States,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends object
> = {
  currentState: FsmState<States, Services, Actions, Context>;
  readonly machine: FsmMachine<
    States,
    InitialState,
    Services,
    Actions,
    Context
  >;

  subscribe: (listener: FsmListener) => () => void;
  start: () => SpawnedService[];
  transition: (transitionName: string, value?: any) => SpawnedService[];
  // execute: (action: keyof Actions) => void;
};

export type AnyService = FsmService<any, any, any, any, any>;

export type SpawnedService = {
  id: string;

  // Useful for awaiting the service to complete. For example, if this is a promise
  // service, awaits the promise to complete. For a machine service, awaits the
  // service to reach its final state and return.
  promise: Promise<unknown>;

  status: "pending" | "settled";

  // Some services (such as invoked machines) can be communicated with.
  service: undefined | AnyService;
};

// Holds all state for an interpreted machine.
export type FsmState<States extends object, Services, Actions, Context> = {
  // Machine's current state.
  value: KeyOf<States>;

  // Any live services spawned by the machine.
  spawnedServices: SpawnedService[];

  context: Context;
};

export type AnyState = FsmState<any, any, any, any>;

export type ApplyTransitionResult<
  States extends object,
  Services,
  Actions,
  Context
> = {
  value: FsmState<States, Services, Actions, Context>["value"];
  actions: (keyof Actions)[];
  services: ServiceInvocation<States, Services, Actions, Context>[];
};
