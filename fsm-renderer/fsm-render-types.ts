import type { ElkEdge, ElkNode } from "elkjs";
import { DeepReadonly } from "../fsm-ts/fsm-core-types";
import type { AnyRunningMachine, FsmEffect } from "../fsm-ts/fsm-system-types";
import type { AnyStateDefinition } from "../fsm-ts/fsm-types";

export type GraphChangeDescription =
  | {
      changeType: "added";
    }
  | { changeType: "removed" }
  | { changeType: "no-change" };

export type ElkNodePromiseMetadata = {
  type: "promise";
  promise: FsmEffect;
  label: string;
};

export type ElkNodeStateMetadata = {
  type: "state";
  definition: DeepReadonly<AnyStateDefinition> | undefined;
  hidden?: boolean;
  label: string;
  value: string;
};

export type ElkNodeTransitionMetadata = {
  type: "transition";
  execute?: () => void;
  label: string;
  target: string;
};

export type ElkNodeMetadata =
  | { type: "root" }
  | ElkNodeStateMetadata
  | ElkNodeTransitionMetadata
  | { type: "machine"; instance: AnyRunningMachine; label: string }
  | { type: "invoke"; label: string }
  | ElkNodePromiseMetadata;

export type ElkNodeWithMetadata = DeepReadonly<
  ElkNode & { metadata: ElkNodeMetadata }
>;
export type ElkNodeWithParent = ElkNodeWithMetadata &
  DeepReadonly<{ parent?: ElkNode }>;

export type FsmRendererNode = ElkNodeWithParent & GraphChangeDescription;
export type FsmRendererEdge = ElkEdge;
