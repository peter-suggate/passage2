import type { ElkEdge, ElkNode } from "elkjs";
import { DeepReadonly } from "../fsm-ts/fsm-core-types";
import type {
  AnyRunningMachine,
  FsmEffect,
  FsmRunningMachine,
} from "../fsm-ts/fsm-system-types";
import type { AnyOptions, AnyStateDefinition } from "../fsm-ts/fsm-types";

export type GraphChangeDescription =
  | {
      changeType: "added";
    }
  | { changeType: "removed" }
  | { changeType: "no-change" };

export type ElkNodePromiseMetadata = GraphChangeDescription & {
  type: "promise";
  promise: FsmEffect;
  label: string;
};

export type ElkNodeStateMetadata = GraphChangeDescription & {
  type: "state";
  definition: DeepReadonly<AnyStateDefinition> | undefined;
  hidden?: boolean;
  label: string;
  value: string;
};

export type ElkNodeTransitionMetadata = GraphChangeDescription & {
  type: "transition";
  execute?: () => void;
  label: string;
  target: string;
};

export type ElkNodeStateInvokeMetadata = GraphChangeDescription & {
  type: "invoke";
  label: string;
};

type ElkNodeRootMetadata = GraphChangeDescription & { type: "root" };

export type ElkNodeMachineMetadata = GraphChangeDescription & {
  type: "machine";
  instance: AnyRunningMachine;
  label: string;
};

export type ElkNodeMetadata =
  | ElkNodeRootMetadata
  | ElkNodeStateMetadata
  | ElkNodeTransitionMetadata
  | ElkNodeMachineMetadata
  | ElkNodeStateInvokeMetadata
  | ElkNodePromiseMetadata;

export type ElkNodeWithMetadata = DeepReadonly<
  ElkNode & { metadata: ElkNodeMetadata }
>;
export type ElkNodeWithParent = ElkNodeWithMetadata &
  DeepReadonly<{ parent?: ElkNode }>;

export type FsmRendererNode = ElkNodeWithParent & GraphChangeDescription;
export type FsmRendererEdge = ElkEdge;
