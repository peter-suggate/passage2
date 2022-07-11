export const quietNonModuleError = 1;
// import { Edge, Node } from "react-flow-renderer";
// import {
//   invokableChildMachines,
//   invokableMachineForState,
//   machineTransitions,
// } from "../fsm-ts/fsm-transforms";
// import { AnyMachine } from "../fsm-ts/fsm-types";
// import {
//   guessStateNodeDimensions,
//   guessTransitionNodeDimensions,
//   machineNodeHeaderHeight,
//   mapElkNodeToReact,
//   nodeVerticalSpacing,
//   nodeIdForTransition,
// } from "./fsm-render-util";
// import ELK, { ElkEdge, ElkNode } from "elkjs";
// import { AnyService } from "../fsm-ts/fsm-service-types";
// import {
//   ElkNodeWithMetadata,
//   FsmRendererEdge,
//   FsmRendererNode,
// } from "./fsm-render-types";

// const transitionNodesForMachine = (machine: AnyMachine): ElkNode[] => {
//   return machineTransitions(machine).map((transition) => ({
//     id: nodeIdForTransition(machine.id, transition),
//     labels: [{ text: transition.name, id: "transition" }],
//     ...guessTransitionNodeDimensions(transition.name),
//   }));
// };

// export const nodesForMachine = (machine: AnyMachine): ElkNode[] => {
//   return [
//     ...Object.entries(machine.states).map(([id, state]) => {
//       const childMachine = invokableMachineForState(machine, id);

//       return {
//         id: `${machine.id}-${id}`,
//         labels: [{ text: id, id: childMachine ? "machine" : "state" }],
//         ...guessStateNodeDimensions(id, state),
//         children: childMachine ? [...nodesForMachine(childMachine)] : [],
//         layoutOptions: {
//           // "elk.algorithm": "layered",
//           // "elk.hierarchyHandling": "INCLUDE_CHILDREN",
//           // "elk.layered.considerModelOrder": "NODES_AND_EDGES",
//           // "elk.layered.wrapping.strategy": "MULTI_EDGE",
//           // "elk.aspectRatio": "2",
//           // "elk.direction": "DOWN",
//           "spacing.nodeNode": `${
//             machineNodeHeaderHeight + nodeVerticalSpacing
//           }`,
//         },
//       };
//     }),
//     ...transitionNodesForMachine(machine),
//   ];
// };

// export const edgesForMachine = (machine: AnyMachine): ElkEdge[] => {
//   return [
//     ...machineTransitions(machine, true).flatMap((transition) => [
//       {
//         id: `${nodeIdForTransition(machine.id, transition)}-in`,
//         sources: [`${machine.id}-${transition.source}`],
//         targets: [`${machine.id}-${transition.target as string}`],
//       },
//     ]),
//     ...machineTransitions(machine).flatMap((transition) => [
//       {
//         id: `${nodeIdForTransition(machine.id, transition)}-in`,
//         sources: [`${machine.id}-${transition.source}`],
//         targets: [nodeIdForTransition(machine.id, transition)],
//       },
//       {
//         id: `${nodeIdForTransition(machine.id, transition)}-out`,
//         sources: [nodeIdForTransition(machine.id, transition)],
//         targets: [`${machine.id}-${transition.target as string}`],
//       },
//     ]),
//     ...invokableChildMachines(machine).flatMap(edgesForMachine),
//   ];
// };

// export const buildMachineInternalGraph = async (service: AnyService) => {
//   const elk = new ELK();

//   const { machine } = service;

//   const graph = {
//     id: "root",
//     layoutOptions: {
//       "elk.algorithm": "layered",
//       "elk.hierarchyHandling": "INCLUDE_CHILDREN",
//       "elk.layered.considerModelOrder": "NODES_AND_EDGES",
//       "elk.layered.wrapping.strategy": "MULTI_EDGE",
//       // "elk.aspectRatio": "2",
//       "elk.direction": "DOWN",
//       "spacing.nodeNode": `${machineNodeHeaderHeight + nodeVerticalSpacing}`,
//     },
//     children: [
//       {
//         id: `${machine.id}`,
//         labels: [{ text: machine.id, id: "machine" }],
//         children: nodesForMachine(machine),
//       },
//     ],
//     edges: edgesForMachine(machine),
//   };

//   // console.log(JSON.stringify(graph, undefined, 2));
//   const layout = await elk.layout(graph);

//   console.log(JSON.stringify(layout, undefined, 2));

//   const nodes: Node[] = layout.children!.flatMap((child) => {
//     // const childService = [];
//     return mapElkNodeToReact(child as FsmRendererNode);
//   });

//   const edges: Edge[] = layout.edges!.map((edge) => {
//     const { id, sources, targets } = edge as any;

//     return {
//       id,
//       source: sources[0],
//       target: targets[0],
//       targetHandle: "target",
//       sourceHandle: "source",
//     };
//   });

//   return { nodes, edges };
// };

// export const buildGraph = (service: AnyService) => {
//   return buildMachineInternalGraph(service);
//   //   const nodes: Node[] = [];
//   //   const edges: Edge[] = [];

//   //   const SPACING_X = 600;

//   //   nodes.push({
//   //     id: `node-${0}`,
//   //     type: "machineNode",
//   //     position: { x: SPACING_X / 2, y: 0 },
//   //     data: { value: { service, id: service.machine.id } },
//   //   });

//   //   service.currentState.spawnedServices
//   //     .filter(({ status }) => status !== "settled")
//   //     .forEach((spawnedService, index) => {
//   //       nodes.push({
//   //         id: `node-${index + 1}`,
//   //         type: spawnedService.service ? "machineNode" : "promiseNode",
//   //         position: { x: SPACING_X / 2 + (SPACING_X / 2) * (index + 1), y: 0 },
//   //         data: { value: spawnedService },
//   //       });

//   //       edges.push({
//   //         id: `edge-${index + 1}`,
//   //         source: `node-0`,
//   //         target: `node-${index + 1}`,
//   //         targetHandle: "child",
//   //         sourceHandle: "parent",
//   //       });
//   //     });

//   //   //   const nodes: Node[] = [
//   //   //     {
//   //   //       id: "node-1",
//   //   //       type: "machineNode",
//   //   //       position: { x: 0, y: 0 },
//   //   //       data: { value: service },
//   //   //     },
//   //   //     {
//   //   //       id: "node-2",
//   //   //       type: "output",
//   //   //       targetPosition: Position.Top,
//   //   //       position: { x: 0, y: 200 },
//   //   //       data: { label: "node 2" },
//   //   //     },
//   //   //     {
//   //   //       id: "node-3",
//   //   //       type: "output",
//   //   //       targetPosition: Position.Top,
//   //   //       position: { x: 200, y: 200 },
//   //   //       data: { label: "node 3" },
//   //   //     },
//   //   //   ];

//   //   //   const edges: Edge[] = [
//   //   //     { id: "edge-1", source: "node-1", target: "node-2", sourceHandle: "a" },
//   //   //     { id: "edge-2", source: "node-1", target: "node-3", sourceHandle: "b" },
//   //   //   ];

//   //   return { nodes, edges };
// };
