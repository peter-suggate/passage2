import { KeyOf } from "./fsm-core-types";
import {
  ActionDefinitions,
  FsmEvent,
  FsmMachine,
  ServiceDefinitions,
  ServiceInvocation,
  StateDefinitions,
} from "./fsm-types";

export type StepperFunc = (event: AnyServiceEvent) => Promise<void>;

export type FsmServiceEvent<
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends object
> =
  | {
      type: "transition";
      name: string | null;
      value: any;
    }
  | {
      type: "entering state";
      value: KeyOf<States>;
    }
  | {
      type: "exiting state";
      value: KeyOf<States>;
    }
  | {
      type: "transitioned to new state";
      prevState: FsmState<States, Context>;
      newState: FsmState<States, Context>;
    }
  | { type: "context updated"; prevContext: Context; newContext: Context }
  | { type: "execute actions"; actions: (keyof Actions)[]; event: FsmEvent }
  | {
      type: "invoke service";
      invocation: ServiceInvocation<States, Services, Actions, Context>;
    }
  | {
      type: "service created";
      id: string;
      invocation: ServiceInvocation<States, Services, Actions, Context>;
    }
  | {
      type: "service started";
      id: string;
      descriptor: SpawnedServiceCommon;
    }
  | {
      type: "service finished";
      id: string;
      result: unknown;
    };

export type AnyServiceEvent = FsmServiceEvent<any, any, any, any>;
export type FsmListener = (e: AnyServiceEvent) => void;

export type FsmServiceOptions = {
  stepper: StepperFunc;
};

export type FsmService<
  States extends StateDefinitions<States, Services, Actions, Context>,
  InitialState extends keyof States,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends object
> = {
  currentState: FsmState<States, Context>;
  readonly machine: FsmMachine<
    States,
    InitialState,
    Services,
    Actions,
    Context
  >;

  subscribe: (listener: FsmListener) => () => void;
  start: () => void;
  transition: (transitionName: string, value?: any) => void;
  tick: () => Promise<void>;

  options: FsmServiceOptions;

  resubscribeToSpawnedServices(): void;
};

export type AnyService = FsmService<any, any, any, any, any>;

export type SpawnedServiceCommon = {
  // Some services (such as invoked machines) can be communicated with.
  service: undefined | AnyService;
};

export type PendingService = SpawnedServiceCommon & {
  // Useful for awaiting the service to complete. For example, if this is a promise
  // service, awaits the promise to complete. For a machine service, awaits the
  // service to reach its final state and return.
  promise: Promise<unknown>;

  // Some services (such as invoked machines) can be communicated with.
  service: undefined | AnyService;
};

export type SpawnedService =
  | ({ status: "not started" } & SpawnedServiceCommon)
  | ({ status: "pending" } & PendingService)
  | ({ status: "settled" } & SpawnedServiceCommon);

// Holds all state for an interpreted machine.
export type FsmState<States extends object, Context> = {
  // Machine's current state.
  value: KeyOf<States>;

  // Any live services spawned by the machine.
  spawnedServices: { [id: string]: SpawnedService };

  context: Context;
};

export type AnyState = FsmState<any, any>;

export type ApplyTransitionResult<
  States extends object,
  Services,
  Actions,
  Context
> = {
  value: FsmState<States, Context>["value"];
  actions: (keyof Actions)[];
  services: ServiceInvocation<States, Services, Actions, Context>[];
};

// export type FsmServiceWorkFunc = () => FsmServiceEvent;
