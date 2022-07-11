import { ElkEdge, ElkNode } from "elkjs";
import { Edge, Node } from "react-flow-renderer";
import { AnyService } from "../fsm-ts/fsm-service-types";
import type {
  FsmOptions,
  StateDefinitionForOptions,
} from "../fsm-ts/fsm-types";
import { buildServiceGraph } from "./buildServiceGraph";
import type {
  ElkNodeWithMetadata,
  ElkNodeWithParent,
  FsmRendererEdge,
  FsmRendererNode,
} from "./fsm-render-types";
import { graphDiff } from "./graphDiff";

const fontWidth = () => 12;

export const guessStateNodeDimensions = <Options extends FsmOptions>(
  id: string,
  value: StateDefinitionForOptions<Options>
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

export const mapElkNodeToReact = (
  node: FsmRendererNode,
  // service: AnyService,
  parent?: ElkNode
): Node[] => {
  const { id, labels, metadata, changeType, x, y, width, height, children } =
    node;

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
        ...metadata,
        changeType,
        hasChildren: !!children?.length,
        width,
        height: height! + (children?.length ? machineNodeHeaderHeight : 0),
        onClick:
          nodeType === "transition"
            ? () => metadata.service.transition(value)
            : undefined,
      },
      parentNode: parent?.id,
    },
    ...(children
      ? children.flatMap((child) =>
          mapElkNodeToReact(child as FsmRendererNode, node)
        )
      : []),
  ];
};

export const flattenElkNode = (
  node: ElkNodeWithMetadata,
  parent: ElkNodeWithParent | undefined
): ElkNodeWithParent[] => {
  const { children } = node;

  return [
    {
      ...node,
      parent,
    },
    ...(children
      ? children.flatMap((child) =>
          flattenElkNode(child as FsmRendererNode, node)
        )
      : []),
  ];
};

const flattenElkGraph = (root: ElkNodeWithMetadata): ElkNodeWithParent[] =>
  root.children!.flatMap((child) => {
    return flattenElkNode(child as ElkNodeWithMetadata, undefined);
  });

const mergeGraphWithPrevious = (
  nodes: ElkNodeWithParent[],
  edges: ElkEdge[],
  prevNodes: ElkNodeWithParent[],
  prevEdges: ElkEdge[]
): { nodes: FsmRendererNode[]; edges: FsmRendererEdge[] } => ({
  nodes: graphDiff(nodes, prevNodes),
  edges: graphDiff(edges, prevEdges),
});

export const mapToReactFlow = (
  nodes: FsmRendererNode[],
  edges: FsmRendererEdge[]
) => {
  return {
    nodes: nodes.map((node) => {
      const {
        id,
        labels,
        metadata,
        changeType,
        x,
        y,
        width,
        height,
        children,
        parent,
      } = node;

      const value = labels![0].text;
      const nodeType = metadata.type;

      return {
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
          ...metadata,
          changeType,
          hasChildren: !!children?.length,
          width,
          height: height! + (children?.length ? machineNodeHeaderHeight : 0),
          onClick:
            nodeType === "transition"
              ? () => metadata.service.transition(value)
              : undefined,
        },
        parentNode: parent?.id,
      };
    }),
    edges: edges.map((edge) => {
      const { id, sources, targets } = edge as any;

      return {
        id,
        source: sources[0],
        target: targets[0],
        targetHandle: "target",
        sourceHandle: "source",
      };
    }),
  };
};

export const fsmToGraph = async (
  service: AnyService,
  prevNodes: FsmRendererNode[],
  prevEdges: FsmRendererEdge[]
) => {
  const graph = await buildServiceGraph(service);

  const merged = mergeGraphWithPrevious(
    flattenElkGraph(graph),
    graph.edges || [],
    prevNodes,
    prevEdges
  );

  return merged; //mapToReactFlow(merged.nodes, merged.edges);
};
