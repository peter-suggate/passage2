import { ElkEdge } from "elkjs";
import { MarkerType } from "react-flow-renderer";
import { DeepReadonly } from "../fsm-ts/fsm-core-types";
import { FsmRunningMachine } from "../fsm-ts/fsm-system-types";
import {
  machineStateDefinition,
  stateTransitionDefinitions,
  stateTransitions,
} from "../fsm-ts/fsm-transforms";
import type {
  AnyStateDefinition,
  FsmOptions,
  StateDefinitionForOptions,
} from "../fsm-ts/fsm-types";
import type {
  ElkNodeWithMetadata,
  ElkNodeWithParent,
  FsmRendererEdge,
  FsmRendererNode,
} from "./fsm-render-types";
import { graphDiff } from "./graphDiff";

const fontWidth = () => 12;

type NodeDisplayMetrics = {
  padding: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
  desiredMinSize: {
    width: number;
    height: number;
  };
};

export const guessMachineNodeDimensions = <Options extends FsmOptions>(
  instance: FsmRunningMachine<Options>
): NodeDisplayMetrics => {
  const { machine, state } = instance;

  const PAD = 32;

  const MACHINE_MIN_WIDTH = 240;
  const TITLE_HEIGHT_AND_PAD = 24 * 2 + 20;
  const CONTEXT_HEIGHT_AND_PAD = 120;
  // const TRANSITION_HEIGHT = 64;
  const TRANSITION_PAD = 16;

  // const transitions = machineTransitions(machine, { state: state.value });

  return {
    padding: {
      bottom: PAD,
      left: PAD,
      right: PAD,
      top: /*PAD + CONTEXT_HEIGHT_AND_PAD*/ +TITLE_HEIGHT_AND_PAD,
    },
    desiredMinSize: {
      width: Math.max(
        MACHINE_MIN_WIDTH,
        PAD * 2 + machine.id.length * fontWidth()
      ),
      height:
        PAD * 2 +
        CONTEXT_HEIGHT_AND_PAD +
        TITLE_HEIGHT_AND_PAD +
        guessStateNodeDimensions(
          instance.state.id,
          machineStateDefinition(machine, state.value || machine.initial)
        ).height +
        // Object.keys(machine.states).length * 32 +
        // transitions.length * TRANSITION_HEIGHT +
        TRANSITION_PAD * 2,
    },
  };
};

type GuessSizeFunc = (label: string) => { width: number; height: number };

const accumulateSizes = (labels: string[], guessSize: GuessSizeFunc) =>
  labels.map(guessSize).reduce(
    (acc, cur) => ({
      width: Math.max(acc.width, cur.width),
      height: acc.height + cur.height,
    }),
    {
      width: 0,
      height: 0,
    }
  );

export const guessStateNodeDimensions = <Options extends FsmOptions>(
  id: string,
  definition: DeepReadonly<StateDefinitionForOptions<Options>>
): { width: number; height: number } => {
  const sizeForTransitions = accumulateSizes(
    stateTransitionDefinitions(definition, { includeOnTransitions: true }),
    guessTransitionNodeDimensions(false)
  );

  const sizeForInvoke = guessInvokeNodeDimensions(definition, true);

  const heightForFinal =
    definition.type === "final" ? 40 + (definition.data ? 32 : 0) : 0;

  return {
    width: Math.max(
      220,
      sizeForTransitions.width,
      sizeForInvoke.width,
      id.length * fontWidth()
    ),
    height:
      64 + sizeForTransitions.height + sizeForInvoke.height + heightForFinal,
  };
};

export const guessTransitionNodeDimensions =
  (forInvoke?: boolean) => (label: string) => ({
    width: Math.max(200, label.length * fontWidth()),
    height: forInvoke ? 20 : 46,
  });

export const guessInvokeNodeDimensions = (
  stateDefinition: DeepReadonly<AnyStateDefinition>,
  includePad?: boolean
) => {
  const sizeForTransitions = accumulateSizes(
    stateTransitionDefinitions(stateDefinition, {
      includeInvokeTransitions: true,
    }),
    guessTransitionNodeDimensions(true)
  );

  return sizeForTransitions.height
    ? {
        width: sizeForTransitions.width,
        height: sizeForTransitions.height + 44 + (includePad ? 50 : 0),
      }
    : { width: 0, height: 0 };
};

export const machineNodeHeaderHeight = 32;

export const nodeVerticalSpacing = 16;

export const nodeIdForTransition = (
  machineId: string,
  transition: { name: string; source: string }
) => `${machineId}:${transition.source}-${transition.name}`;

export const nodeIdForInvoke = (machineId: string, src: string) =>
  `${machineId}:invoke-${src}`;

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

type Graph = {
  nodes: FsmRendererNode[];
  edges: FsmRendererEdge[];
};

const mergeGraphWithPrevious = (
  nodes: ElkNodeWithParent[],
  edges: ElkEdge[],
  prevNodes: ElkNodeWithParent[],
  prevEdges: ElkEdge[]
): { nodes: FsmRendererNode[]; edges: FsmRendererEdge[] } => ({
  nodes: graphDiff(nodes, prevNodes),
  edges: graphDiff(edges, prevEdges),
});

export const toReactFlow = ({ nodes, edges }: Graph) => {
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

      if (metadata.type === "root") throw Error(); // TODO remove me
      // const value = labels![0].text;
      const value = `${metadata.label}`; // labels![0].text;
      const nodeType = metadata.type;

      return {
        id,
        type:
          nodeType === "machine"
            ? "machineNode"
            : nodeType === "state"
            ? "stateNode"
            : nodeType === "promise"
            ? "promiseNode"
            : nodeType === "invoke"
            ? "invokeNode"
            : "transitionNode",
        position: { x: x!, y: y! + (parent ? machineNodeHeaderHeight : 0) },
        data: {
          value,
          metadata,
          changeType,
          hasChildren: !!children?.length,
          width,
          height: height! + (children?.length ? machineNodeHeaderHeight : 0),
          onClick:
            metadata.type === "transition" && metadata.execute
              ? () => {
                  metadata.type === "transition" && metadata.execute!();
                }
              : undefined,
          // onClick:
          //   nodeType === "transition"
          //     ? () => metadata.service.transition(value)
          //     : undefined,
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
        // type: "smoothstep",
        // markerStart: "arrowclosed",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#555",
        },
        zIndex: 1,
        style: {
          stroke: "#555",
          strokeWidth: 2,
        },
        // label: "bla",
      };
    }),
  };
};

export const toMergedGraph = (
  graph: ElkNodeWithMetadata,
  prevGraph: ReturnType<typeof mergeGraphWithPrevious> | undefined
  // service: AnyService,
  // prevNodes: FsmRendererNode[],
  // prevEdges: FsmRendererEdge[]
) => {
  // const graph = await buildServiceGraph(service);

  const merged = mergeGraphWithPrevious(
    flattenElkGraph(graph),
    (graph.edges as ElkEdge[]) || [],
    prevGraph?.nodes || [],
    prevGraph?.edges || []
    // prevNodes,
    // prevEdges
  );

  return merged; //mapToReactFlow(merged.nodes, merged.edges);
};
