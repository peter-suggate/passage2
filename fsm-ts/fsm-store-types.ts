import { DeepReadonly } from "./fsm-core-types";
import type {
  FsmCommand,
  FsmListener,
  FsmSystemData,
} from "./fsm-system-types";
import type { AnyOptions, FsmOptions } from "./fsm-types";

type Debuggable = {
  debug(): void;
};

type Subscribable<T> = {
  subscribe: (listener: T) => () => void;
  //   subscribeCommandQueue: (listener: FsmListener) => () => void;
};
type EffectsProcessable = {
  waitForAllEffects: () => Promise<void>;
};
type ReceivesEvents = {
  send: <Options extends FsmOptions>(
    commandOrCommands: FsmCommand<Options>
    //   | FsmCommand<Options>[]
  ) => void;
};
type Tickable = { tick: () => void; exhaust: () => void };
type AccessibleData<T> = { data: () => T };
// type Updatable = { update: (data: FsmSystemData) => void };

export type FsmCommandQueueEvent = { command: FsmCommand<AnyOptions> } & (
  | { kind: "sent" }
  | { kind: "processed" }
);

export type FsmCommandQueueListener = (event: FsmCommandQueueEvent) => void;

export type FsmCommandStore = ReceivesEvents &
  Tickable &
  Subscribable<FsmCommandQueueListener> &
  Debuggable &
  AccessibleData<FsmCommand<AnyOptions>[]>;

export type FsmStore = AccessibleData<FsmSystemData> &
  EffectsProcessable &
  Subscribable<FsmListener> &
  Debuggable;
