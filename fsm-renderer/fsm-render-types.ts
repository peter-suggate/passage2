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

export type ElkNodeMetadata =
  | { type: "root" }
  | { type: "state"; definition?: AnyStateDefinition; label: string }
  | { type: "transition"; execute: () => void; label: string }
  | { type: "machine"; instance: AnyRunningMachine; label: string }
  | { type: "promise"; promise: FsmEffect; label: string };

export type ElkNodeWithMetadata = DeepReadonly<
  ElkNode & { metadata: ElkNodeMetadata }
>;
export type ElkNodeWithParent = ElkNodeWithMetadata &
  DeepReadonly<{ parent?: ElkNode }>;

export type FsmRendererNode = ElkNodeWithParent & GraphChangeDescription;
export type FsmRendererEdge = ElkEdge;
