import React from "react";
import ReactFlow, { useEdgesState, useNodesState } from "react-flow-renderer";
import styles from "./FsmRenderer.module.css";
import { MachineNode } from "./MachineNode";
import { PromiseNode } from "./PromiseNode";
import { menuMachine } from "../examples/practice/menuMachine";
import { StateNode } from "./StateNode";
import { TransitionNode } from "./TransitionNode";
import { commandStore, fsmStore } from "../fsm-ts/fsmStore";
import { graphStore } from "./graphStore";
import { emptySystem } from "../fsm-ts/fsmSystem";

// const stepper = async (e: FsmEvent) => sleep(0);
// const service = createService(menuMachine, { stepper });
// service.start();
const commands = commandStore();

const fsm = fsmStore(commands)(
  emptySystem()
  // pipe(emptySystem(), instantiateMachine(menuMachine), processCommands())
);
commands.send({ type: "instantiate", machine: menuMachine, parent: undefined });
// commands.exhaust();
const graph = graphStore(commands, fsm);
// fsm.send({ type: "instantiate", machine: menuMachine, parent: undefined });

// we define the nodeTypes outside of the component to prevent re-renderings
// you could also use useMemo inside the component
const nodeTypes = {
  machineNode: MachineNode,
  promiseNode: PromiseNode,
  stateNode: StateNode,
  transitionNode: TransitionNode,
};

// const useTodosGraph = makeFsmGraphStore(service);

export const FsmRenderer = () => {
  // React.useEffect(() => {
  //   fsm.tick();
  // }, []);

  const { nodes, edges } = React.useSyncExternalStore(
    graph.subscribe,
    graph.getSnapshot,
    graph.getSnapshot
  );

  const allCommands = React.useSyncExternalStore(
    commands.subscribe,
    commands.data,
    commands.data
  );
  // const {
  //   nodes: initialNodes,
  //   edges: initialEdges,
  //   update,
  //   updateRemoveOld,
  // } = useTodosGraph();
  // const edges: Edge[] = [];
  // const nodes: Node[] = [];
  // const [nodes] = useNodesState(state.)

  // let prevNodes: FsmRendererNode[] = [];
  // let prevEdges: FsmRendererEdge[] = [];
  // const [nodes, setNodes, onNodesChange] = useNodesState([]);
  // const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // const [prevNodes, setPrevNodes] = React.useState<FsmRendererNode[]>([]);
  // const [prevEdges, setPrevEdges] = React.useState<FsmRendererEdge[]>([]);

  // React.useEffect(() => {
  //   const fn = async () => {
  //     console.log("prevNodes.length", prevNodes.length);
  //     const { nodes: updatedNodes, edges: updatedEdges } = await fsmToGraph(
  //       service,
  //       prevNodes,
  //       prevEdges
  //     );
  //     // const graph = await buildServiceGraph(service);

  //     // const removedNodes = nodes.filter(
  //     //   (existingNode) =>
  //     //     !graph.nodes.some((newNode) => existingNode.id === newNode.id)
  //     // );
  //     // console.log(removedNodes);

  //     // graph.nodes.forEach((node) => {
  //     //   if (removedNodes.some((n) => n.id === node.id)) {
  //     //     // node.data.removing = true;
  //     //     node.data = { ...node.data, removing: true };
  //     //   }
  //     // });

  //     // const result = { nodes: previousGraph.nodes, edges: previousGraph.edges };

  //     // const newNodes = graphDiff(graph.nodes, nodes);
  //     // const newEdges = graphDiff(graph.edges, edges);

  //     const result = mapToReactFlow(updatedNodes, updatedEdges);

  //     setNodes(result.nodes);
  //     setEdges(result.edges);

  //     prevNodes = updatedNodes;
  //     prevEdges = updatedEdges;
  //     // console.log(updatedNodes.map((n) => ({ changeType: n.changeType })));
  //     // setNodes(reactFlowNodes);
  //     // setEdges(reactFlowEdges);

  //     // setPrevNodes(updatedNodes);
  //     // setPrevEdges(updatedEdges);
  //   };

  //   const disposer = service.subscribe(async (event) => {
  //     fn();
  //     // buildServiceGraph(service).then((g) => {
  //     //   setNodes(g.nodes);
  //     //   setEdges(g.edges);
  //     // });
  //     // updateRemoveOld();
  //     // window.setTimeout(() => {
  //     //   // update();
  //     // }, 500);
  //   });

  //   fn();

  //   return disposer;
  // }, [setEdges, setNodes]);

  return (
    <>
      <ReactFlow
        className={styles.fsmRenderer}
        style={{ position: "absolute" }}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        // fitView
      />
      {allCommands.map((c, i) => (
        <div key={i}>{c.type}</div>
      ))}
    </>
  );
};

export default FsmRenderer;
