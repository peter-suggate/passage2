import type { ElkEdge, ElkNode } from "elkjs";
import type { AnyService } from "../fsm-ts/fsm-service-types";
import type { AnyStateDefinition } from "../fsm-ts/fsm-types";

export type GraphChangeDescription =
  | {
      changeType: "added";
    }
  | { changeType: "removed" }
  | { changeType: "no-change" };

export type ElkNodeMetadata = {
  service: AnyService;
} & (
  | { type: "state"; definition?: AnyStateDefinition }
  | { type: "transition" }
  | { type: "machine" }
);

export type ElkNodeWithMetadata = ElkNode & { metadata: ElkNodeMetadata };
export type ElkNodeWithParent = ElkNodeWithMetadata & { parent?: ElkNode };

export type FsmRendererNode = ElkNodeWithParent & GraphChangeDescription;
export type FsmRendererEdge = ElkEdge;
