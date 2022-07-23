import { DeepReadonly, KeyOf } from "./fsm-core-types";
import {
  AnyOptions,
  FsmEvent,
  FsmMachine,
  FsmOptions,
  MachineDefinition,
  ServiceInvocation,
} from "./fsm-types";

export type StepperFunc<Options extends FsmOptions> = (
  event: FsmInterpreterEvent<Options>
) => Promise<void>;

export type FsmEffect = {
  parent: FsmServiceId;
  id: FsmServiceId;
  name: string;
  execute: () => Promise<FsmCommand<AnyOptions>[]>;
};

type InterpreterCommand<Options extends FsmOptions> =
  | {
      type: "instantiate";
      machine: MachineDefinition<Options>;
      parent?: FsmServiceId | null;
    }
  | ({
      id: FsmServiceId;
    } & (
      | {
          type: "transition";
          name: string | null;
          value?: any;
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
          type: "execute actions";
          actions: KeyOf<Options["Actions"]>[];
          event: FsmEvent;
        }
      | {
          type: "enter state";
          value: KeyOf<Options["States"]>;
        }
      | {
          type: "exit state";
          value: KeyOf<Options["States"]>;
        }
      | {
          type: "exit child service";
          child: FsmServiceId;
          // result: unknown;
        }
    ));

export type FsmCommand<Options extends FsmOptions> = DeepReadonly<
  InterpreterCommand<Options>
>;

export type FsmInterpreterEvent<Options extends FsmOptions> = {
  id: FsmServiceId;
} & {
  type: "context updated";
  prevContext: Options["Context"];
  newContext: Options["Context"];
};

export type FsmRep = Readonly<[FsmSystemData, FsmCommand<AnyOptions>[]]>;

export type AnyServiceEvent = FsmInterpreterEvent<AnyOptions>;
export type FsmListener = <Options extends FsmOptions>(
  e: DeepReadonly<FsmInterpreterEvent<Options> | FsmCommand<Options>>,
  latest: FsmSystemData
) => void;
export type FsmCommandListener = <Options extends FsmOptions>(
  e: DeepReadonly<FsmCommand<Options>>,
  latest: FsmSystemData
) => void;

export type FsmServiceOptions<Options extends FsmOptions> = {
  stepper: StepperFunc<Options>;
};

export type FsmRunningMachine<Options extends FsmOptions> = {
  readonly state: FsmState<Options>;
  readonly machine: FsmMachine<Options>;
};

export type AnyRunningMachine = FsmRunningMachine<AnyOptions>;

export type FsmService<Options extends FsmOptions> = {
  state: FsmState<Options>;
  readonly machine: FsmMachine<Options>;

  subscribe: (listener: FsmListener) => () => void;
  start: () => void;
  transition: (transitionName: string, value?: any) => void;
  tick: () => Promise<void>;

  options: FsmServiceOptions<Options>;

  resubscribeToSpawnedServices(): void;
};

export type AnyService = FsmService<AnyOptions>;

export type FsmServiceId = string;

export type SpawnedServiceCommon = {
  // Some services (such as invoked machines) can be communicated with.
  service: undefined | FsmServiceId; // FsmService<Options>;
};

export type PendingService = { status: "pending" } & SpawnedServiceCommon & {
    // Useful for awaiting the service to complete. For example, if this is a promise
    // service, awaits the promise to complete. For a machine service, awaits the
    // service to reach its final state and return.
    // promise: Promise<FsmCommand<AnyOptions>[]>;
  };

export type SpawnedService =
  // | ({ status: "not started" } & SpawnedServiceCommon)
  PendingService | ({ status: "settled" } & SpawnedServiceCommon);

// Holds all state for an interpreted machine.
type State<Options extends FsmOptions> = {
  id: FsmServiceId;

  // Machine's current state.
  value: KeyOf<Options["States"]>;

  // Any children (promises, services, etc) spawned by the machine.
  children: FsmChildren;

  context: Options["Context"];

  // Id of parent if a child machine.
  parent: FsmServiceId | null;
};

export type FsmState<Options extends FsmOptions> = DeepReadonly<State<Options>>;

export type AnyState = FsmState<AnyOptions>;

export type ApplyTransitionResult<Options extends FsmOptions> = DeepReadonly<{
  value: State<Options>["value"];
  actions: KeyOf<Options["Actions"]>[];
  services: ServiceInvocation<
    Options["States"],
    Options["Services"],
    Options["Actions"],
    Options["Context"]
  >[];
}>;

export type FsmRunningMachines = Map<
  FsmServiceId,
  FsmRunningMachine<AnyOptions>
>;

export type FsmChildren = Map<FsmServiceId, SpawnedService>;

export type FsmInterpreter = {
  run: <Options extends FsmOptions>(
    parent: FsmMachine<Options>
  ) => FsmRunningMachine<Options>;
  updateMachineState: <Options extends FsmOptions>(
    serviceId: FsmServiceId,
    updates: Partial<FsmState<Options>>
  ) => void;
  enqueueEvent: <Options extends FsmOptions>(
    event: DeepReadonly<FsmInterpreterEvent<Options>>
  ) => void;
  subscribe: (listener: FsmListener) => () => void;
  get: (id: FsmServiceId) => FsmRunningMachine<AnyOptions> | undefined;
  tick: () => Promise<FsmInterpreterEvent<AnyOptions>[]>;
};

type SystemData = {
  instances: FsmRunningMachines;
  // commands: FsmCommand<AnyOptions>[];
  effects: FsmEffect[];
};

export type FsmSystemData = DeepReadonly<SystemData>;
