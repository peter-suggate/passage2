import { useCallback, useState } from "react";
import ReactFlow, {
  Position,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "react-flow-renderer";
import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
} from "react-flow-renderer";

import styles from "./FsmRenderer.module.css";
import { createMachine } from "../fsm-ts/createMachine";
import { createService } from "../fsm-ts/createService";
import { buildGraph } from "./buildGraph";
import { MachineNode } from "./MachineNode";
import { PromiseNode } from "./PromiseNode";

const sleep = async (ms: number) =>
  new Promise((res) => window.setTimeout(() => res(undefined), ms));

const todosMachine = createMachine({
  initial: "loading",
  context: {
    todos: [],
  },
  states: {
    loading: {
      invoke: {
        serviceId: "loadTodos",
        onDone: { target: "displaying", actions: ["onTodosLoaded"] },
        onError: { target: "showing error" },
      },
    },
    displaying: {},
    "showing error": {
      type: "final",
    },
  },
  actions: {
    onTodosLoaded: (context: unknown, event: { todos: string[] }) => ({
      todos: event.todos,
    }),
  },
  services: {
    loadTodos: async () => {
      await sleep(2000);
      return ["Wash dishes", "Finish passage2", "Tidy room"];
    },
  },
});

const todosService = createService(todosMachine);
todosService.start();

// we define the nodeTypes outside of the component to prevent re-renderings
// you could also use useMemo inside the component
const nodeTypes = { machineNode: MachineNode, promiseNode: PromiseNode };

export const FsmRenderer = () => {
  const { edges: initialEdges, nodes: initialNodes } = buildGraph({
    service: todosService,
    promise: new Promise((res) => res(undefined)),
    status: "pending",
  });

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <ReactFlow
      className={styles.fsmRenderer}
      style={{ position: "absolute" }}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      // style={rfStyle}
    />
  );
};
// import { useState, useCallback } from "react";
// import ReactFlow, {
//   addEdge,
//   FitViewOptions,
//   applyNodeChanges,
//   applyEdgeChanges,
//   Node,
//   Edge,
//   NodeChange,
//   EdgeChange,
//   Connection,
// } from "react-flow-renderer";
// import styles from "./FsmRenderer.module.css";

// const initialNodes: Node[] = [
//   { id: "1", data: { label: "Node 1" }, position: { x: 5, y: 5 } },
//   { id: "2", data: { label: "Node 2" }, position: { x: 5, y: 100 } },
// ];

// const initialEdges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

// const fitViewOptions: FitViewOptions = {
//   padding: 0.2,
// };

// export const FsmRenderer = () => {
//   const [nodes, setNodes] = useState<Node[]>(initialNodes);
//   const [edges, setEdges] = useState<Edge[]>(initialEdges);

//   const onNodesChange = useCallback(
//     (changes: NodeChange[]) =>
//       setNodes((nds) => applyNodeChanges(changes, nds)),
//     [setNodes]
//   );
//   const onEdgesChange = useCallback(
//     (changes: EdgeChange[]) =>
//       setEdges((eds) => applyEdgeChanges(changes, eds)),
//     [setEdges]
//   );
//   const onConnect = useCallback(
//     (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
//     [setEdges]
//   );

//   return (
//     <ReactFlow
//       className={styles.fsmRenderer}
//       style={{ position: "absolute" }}
//       nodes={nodes}
//       edges={edges}
//       onNodesChange={onNodesChange}
//       onEdgesChange={onEdgesChange}
//       onConnect={onConnect}
//       fitView
//       fitViewOptions={fitViewOptions}
//     />
//   );
// };
