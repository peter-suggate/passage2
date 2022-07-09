import ELK, { ElkEdge, ElkNode } from "elkjs";
import { stateHasTransitions } from "../fsm-ts/fsm-type-guards";
import {
  invokableMachineForState,
  stateTransitions,
} from "../fsm-ts/fsm-transforms";
import {
  guessStateNodeDimensions,
  guessTransitionNodeDimensions,
  mapElkNodeToReact,
  nodeIdForState,
  nodeIdForTransition,
  nodeLabels,
  transitionId,
} from "./fsm-render-util";
import { Edge, Node } from "react-flow-renderer";
import type { AnyService } from "../fsm-ts/fsm-service-types";
import type {
  ElkNodeMetadata,
  ElkNodeWithMetadata,
  FsmRendererNode,
} from "./fsm-render-types";

const activeStateTransitions = (service: AnyService): ElkNodeWithMetadata[] => {
  const { machine, currentState } = service;

  const state = machine.states[currentState.value];

  if (stateHasTransitions(state)) {
    return stateTransitions(currentState.value, state).map((transition) => ({
      id: nodeIdForTransition(machine.id, transition),
      metadata: { service, type: "transition" },
      labels: [{ text: transition.name, id: "transition" }],
      ...guessTransitionNodeDimensions(transition.name),
    }));
  }

  return [];
};

const activeStateTransitionTargets = (
  service: AnyService
): ElkNodeWithMetadata[] => {
  const { machine, currentState } = service;

  const state = machine.states[currentState.value];

  if (stateHasTransitions(state)) {
    return stateTransitions(currentState.value, state).map((transition) => ({
      id: nodeIdForState(machine.id, transition.target),
      metadata: {
        service,
        type: "state",
        definition: machine.states[transition.target],
      },
      labels: nodeLabels(transition.name, "state"),
      ...guessStateNodeDimensions(
        transition.target,
        machine.states[transition.target]
      ),
    }));
  }

  return [];
};

const activeStateNode = (service: AnyService): ElkNodeWithMetadata => {
  const { machine, currentState } = service;

  const id = currentState.value;

  const stateDefinition = machine.states[id];

  const invokeMachine = invokableMachineForState(machine, id);

  const children: ElkNodeWithMetadata[] = [];
  const edges: ElkEdge[] = [];

  let serviceToUse = service;

  if (invokeMachine) {
    const activeChildService = Object.values(currentState.spawnedServices).find(
      (s) =>
        s.status === "pending" && s.service?.machine.id === invokeMachine.id
    );

    if (activeChildService && activeChildService.status === "pending") {
      if (activeChildService) {
        serviceToUse = activeChildService.service!;

        children.push(...nodesForService(serviceToUse));
        edges.push(...edgesForService(serviceToUse));
      }
    }
  }

  const metadata: ElkNodeMetadata = children.length
    ? { service: serviceToUse, type: "machine" }
    : { service, type: "state", definition: stateDefinition };

  return {
    id: nodeIdForState(machine.id, id),
    metadata,
    labels: [{ text: id, id: children.length ? "machine" : "state" }],
    ...guessStateNodeDimensions(id, stateDefinition),
    children,
    edges,
    layoutOptions: {
      // "elk.algorithm": "layered",
      //   "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      // "elk.layered.considerModelOrder": "NODES_AND_EDGES",
      // "elk.layered.wrapping.strategy": "MULTI_EDGE",
      // "elk.aspectRatio": "2",
      // "elk.direction": "DOWN",
      //   "elk.layered.compaction.postCompaction.strategy": "LEFT",
      //   "elk.padding": `[top=${
      //     children.length ? 300 : 0
      //   }, left=30, right=30, bottom=30]`,
      //   "spacing.nodeNode": `${machineNodeHeaderHeight + nodeVerticalSpacing}`,
    },
  };
};

export const nodesForService = (service: AnyService): ElkNodeWithMetadata[] => {
  //   const { machine, currentState } = service;

  //   const state = machine.states[currentState.value];

  return [
    activeStateNode(service),
    ...activeStateTransitions(service),
    // ...activeStateTransitionTargets(service),
  ];
};

export const edgesForService = (service: AnyService): ElkEdge[] => {
  const { machine, currentState } = service;

  const id = currentState.value;

  const state = machine.states[id];

  if (!stateHasTransitions(state)) return [];

  return [
    ...stateTransitions(id, state).flatMap((transition) => [
      {
        id: transitionId(machine.id, transition, "in"),
        sources: [nodeIdForState(machine.id, transition.source)],
        targets: [nodeIdForTransition(machine.id, transition)],
      },
      //   {
      //     id: `${nodeIdForTransition(machine.id, transition)}-out`,
      //     sources: [nodeIdForTransition(machine.id, transition)],
      //     targets: [`${machine.id}-${transition.target}`],
      //   },
    ]),
  ];
};

export const buildServiceGraph = async (service: AnyService) => {
  const elk = new ELK();

  const { machine } = service;

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.layered.considerModelOrder": "NODES_AND_EDGES",
      "elk.layered.wrapping.strategy": "MULTI_EDGE",
      "elk.aspectRatio": "2",
      "elk.direction": "DOWN",
      //   "elk.padding": `[top=${30}, left=30, right=30, bottom=30]`,
      // "spacing.nodeNode": `${machineNodeHeaderHeight + nodeVerticalSpacing}`,
    },
    metadata: { service, type: "machine" },
    // children: nodesForService(service),
    children: [
      {
        id: `${machine.id}`,
        labels: [{ text: machine.id, id: "machine" }],
        metadata: { type: "machine", service },
        children: nodesForService(service),
      } as ElkNodeWithMetadata,
    ],
    edges: edgesForService(service),
  } as ElkNodeWithMetadata;

  // console.log(JSON.stringify(graph, undefined, 2));
  const layout = await elk.layout(graph);

  //   console.log(JSON.stringify(layout, undefined, 2));

  return layout as ElkNodeWithMetadata;
  // const nodes: Node[] = layout.children!.flatMap((child) => {
  //   return mapElkNodeToReact(child as FsmRendererNode);
  // });

  // return { nodes, edges };
};
