import { KeyOf } from "./fsm-core-types";
import {
  AnyOptions,
  FsmEvent,
  FsmMachine,
  FsmOptions,
  ServiceInvocation,
} from "./fsm-types";

export type StepperFunc<Options extends FsmOptions> = (
  event: FsmServiceEvent<Options>
) => Promise<void>;

export type FsmServiceEvent<Options extends FsmOptions> =
  | {
      type: "transition";
      name: string | null;
      value: any;
    }
  | {
      type: "entering state";
      value: KeyOf<Options["States"]>;
    }
  | {
      type: "exiting state";
      value: KeyOf<Options["States"]>;
    }
  | {
      type: "transitioned to new state";
      prevState: FsmState<Options>;
      newState: FsmState<Options>;
    }
  | {
      type: "context updated";
      prevContext: Options["Context"];
      newContext: Options["Context"];
    }
  | {
      type: "execute actions";
      actions: (keyof Options["Actions"])[];
      event: FsmEvent;
    }
  | {
      type: "invoke service";
      invocation: ServiceInvocation<
        Options["States"],
        Options["Services"],
        Options["Actions"],
        Options["Context"]
      >;
    }
  | {
      type: "service created";
      id: string;
      invocation: ServiceInvocation<
        Options["States"],
        Options["Services"],
        Options["Actions"],
        Options["Context"]
      >;
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

export type AnyServiceEvent = FsmServiceEvent<AnyOptions>;
export type FsmListener = <Options extends FsmOptions>(
  e: FsmServiceEvent<Options>
) => void;

export type FsmServiceOptions<Options extends FsmOptions> = {
  stepper: StepperFunc<Options>;
};

export type FsmService<Options extends FsmOptions> = {
  currentState: FsmState<Options>;
  readonly machine: FsmMachine<Options>;

  subscribe: (listener: FsmListener) => () => void;
  start: () => void;
  transition: (transitionName: string, value?: any) => void;
  tick: () => Promise<void>;

  options: FsmServiceOptions<Options>;

  resubscribeToSpawnedServices(): void;
};

export type AnyService = FsmService<AnyOptions>;

export type SpawnedServiceCommon<Options extends FsmOptions = AnyOptions> = {
  // Some services (such as invoked machines) can be communicated with.
  service: undefined | FsmService<Options>;
};

export type PendingService = { status: "pending" } & SpawnedServiceCommon & {
    // Useful for awaiting the service to complete. For example, if this is a promise
    // service, awaits the promise to complete. For a machine service, awaits the
    // service to reach its final state and return.
    promise: Promise<unknown>;
  };

export type SpawnedService =
  | ({ status: "not started" } & SpawnedServiceCommon)
  | PendingService
  | ({ status: "settled" } & SpawnedServiceCommon);

// Holds all state for an interpreted machine.
export type FsmState<Options extends FsmOptions> = {
  // Machine's current state.
  value: KeyOf<Options["States"]>;

  // Any live services spawned by the machine.
  spawnedServices: { [id: string]: SpawnedService };

  context: Options["Context"];
};

export type AnyState = FsmState<AnyOptions>;

export type ApplyTransitionResult<Options extends FsmOptions> = {
  value: FsmState<Options>["value"];
  actions: (keyof Options["Actions"])[];
  services: ServiceInvocation<
    Options["States"],
    Options["Services"],
    Options["Actions"],
    Options["Context"]
  >[];
};
