import { ElkNode } from "elkjs";
import { Node } from "react-flow-renderer";
import {
  AnyService,
  AnyStateDefinition,
  StateDefinition,
} from "../fsm-ts/fsm-types";

const fontWidth = () => 12;

export const guessStateNodeDimensions = <
  States extends object,
  Services,
  Actions,
  Context
>(
  id: string,
  value: StateDefinition<States, Services, Actions, Context>
) => ({
  width: id.length * fontWidth(),
  height: 32,
});

export const guessTransitionNodeDimensions = (id: string) => ({
  width: id.length * fontWidth(),
  height: 32,
});

export const machineNodeHeaderHeight = 32;

export const nodeVerticalSpacing = 16;

export const nodeIdForTransition = (
  machineId: string,
  transition: { name: string; source: string }
) => `${machineId}:${transition.source}:${transition.name}`;

export const nodeIdForState = (machineId: string, stateId: string) =>
  `${machineId}:${stateId}`;

export const transitionId = (
  machineId: string,
  transition: { name: string; source: string },
  edge: "in" | "out"
) => `${nodeIdForTransition(machineId, transition)}:${edge}`;

export const nodeLabels = (
  text: string,
  nodeType: "machine" | "state" | "transition"
) => [{ id: nodeType, text }];

export type ElkNodeMetadata = {
  service: AnyService;
} & (
  | { type: "state"; definition?: AnyStateDefinition }
  | { type: "transition" }
  | { type: "machine" }
);

export type ElkNodeWithMetadata = ElkNode & { metadata: ElkNodeMetadata };

export const mapElkNodeToReact = (
  node: ElkNodeWithMetadata,
  // service: AnyService,
  parent?: ElkNode
): Node[] => {
  const { id, labels, metadata, x, y, width, height, children } = node;

  const value = labels![0].text;
  const nodeType = metadata.type;

  return [
    {
      id,
      type:
        nodeType === "machine"
          ? "machineNode"
          : nodeType === "state"
          ? "stateNode"
          : "transitionNode",
      position: { x: x!, y: y! + (parent ? machineNodeHeaderHeight : 0) },
      data: {
        value,
        service: metadata.service,
        definition: metadata.type === "state" ? metadata.definition : undefined,
        hasChildren: !!children?.length,
        width,
        height: height! + (children?.length ? machineNodeHeaderHeight : 0),
        onClick:
          nodeType === "transition"
            ? () => node.metadata.service.transition(value)
            : undefined,
      },
      parentNode: parent?.id,
    },
    ...(children
      ? children.flatMap((child) =>
          mapElkNodeToReact(child as ElkNodeWithMetadata, node)
        )
      : []),
  ];
};
