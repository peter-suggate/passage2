export type Transition<States, Actions, Value = any> = {
  target: keyof States;
  value: Value;
  actions: (keyof Actions)[];
};

export type TransitionEvent<States, Actions> = {
  type: string;
} & Transition<States, Actions>;

export type FsmEvent<States, Actions> = { type: string };

export type FsmEventHandler<States, Actions> = (
  event: FsmEvent<States, Actions>
) => void;

export type ServiceInvocation<States, Services, Actions, Context> = {
  serviceId: keyof Services;
  onDone: Transition<States, Actions>;
  onError: Transition<States, Actions>;
};

export type StateDefinition<
  States,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions,
  Context
> = {
  type?: "final";
  on?: { [transition: string]: Transition<States, Actions> };
  entry?: keyof Actions;
  exit?: keyof Actions;
  invoke?: ServiceInvocation<States, Services, Actions, Context>;
};

export type StateDefinitions<
  States,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions,
  Context
> = {
  [S in keyof States]: StateDefinition<States, Services, Actions, Context>;
};

export type ServiceDefinition<States, Services, Actions, Context> =
  | ((context: Context, event: FsmEvent<States, Actions>) => Promise<unknown>)
  | FsmMachine<any, any, any, any, any>;

export type ServiceDefinitions<States, Services, Actions, Context> = {
  [S in keyof Services]: ServiceDefinition<States, Services, Actions, Context>;
};

export type ActionDefinitions<States, Actions, Context> = {
  [A in keyof Actions]: (
    context: Context,
    event: FsmEvent<States, Actions>
  ) => Partial<Context>;
};

export type FsmMachine<
  States extends StateDefinitions<States, Services, Actions, Context>,
  InitialState extends keyof States,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<States, Actions, Context>,
  Context extends object
> = {
  initial: InitialState;
  states: StateDefinitions<States, Services, Actions, Context>;
  services: ServiceDefinitions<States, Services, Actions, Context>;
  actions: ActionDefinitions<States, Actions, Context>;
  context: Context;
};

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
  Actions extends ActionDefinitions<States, Actions, Context>,
  Context extends object
> = {
  currentState: FsmState<States, Services, Actions, Context>;

  subscribe: (listener: FsmListener) => () => void;
  start: () => SpawnedService[];
  transition: (transitionName: string) => SpawnedService[];
};

export type AnyService = FsmService<any, any, any, any, any>;

export type SpawnedService = {
  // Useful for awaiting the service to complete. For example, if this is a promise
  // service, awaits the promise to complete. For a machine service, awaits the
  // service to reach its final state and return.
  promise: Promise<unknown>;

  status: "pending" | "settled";

  // Some services (such as invoked machines) can be communicated with.
  service: undefined | AnyService;
};

// Holds all state for an interpreted machine.
export type FsmState<States, Services, Actions, Context> = {
  // Machine's current state.
  value: keyof States;

  // Any live services spawned by the machine.
  spawnedServices: SpawnedService[];

  context: Context;
};

export type ApplyTransitionResult<States, Services, Actions, Context> = {
  value: FsmState<States, Services, Actions, Context>["value"];
  actions: (keyof Actions)[];
  services: ServiceInvocation<States, Services, Actions, Context>[];
};
