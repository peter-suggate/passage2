import { Edge, Node, Position } from "react-flow-renderer";
import { FsmService, SpawnedService } from "../fsm-ts/fsm-types";

export const buildGraph = (service: FsmService<any, any, any, any, any>) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: `node-${0}`,
    type: "machineNode",
    position: { x: 0, y: 0 },
    data: { value: { service } },
  });

  service.currentState.spawnedServices.forEach((spawnedService, index) => {
    nodes.push({
      id: `node-${index + 1}`,
      type: spawnedService.service ? "machineNode" : "promiseNode",
      position: { x: 200 * (index + 1), y: 0 },
      data: { value: spawnedService },
    });

    edges.push({
      id: `edge-${index + 1}`,
      source: `node-0`,
      target: `node-${index + 1}`,
      targetHandle: "a",
      sourceHandle: "a",
    });
  });

  //   const nodes: Node[] = [
  //     {
  //       id: "node-1",
  //       type: "machineNode",
  //       position: { x: 0, y: 0 },
  //       data: { value: service },
  //     },
  //     {
  //       id: "node-2",
  //       type: "output",
  //       targetPosition: Position.Top,
  //       position: { x: 0, y: 200 },
  //       data: { label: "node 2" },
  //     },
  //     {
  //       id: "node-3",
  //       type: "output",
  //       targetPosition: Position.Top,
  //       position: { x: 200, y: 200 },
  //       data: { label: "node 3" },
  //     },
  //   ];

  //   const edges: Edge[] = [
  //     { id: "edge-1", source: "node-1", target: "node-2", sourceHandle: "a" },
  //     { id: "edge-2", source: "node-1", target: "node-3", sourceHandle: "b" },
  //   ];

  return { nodes, edges };
};
