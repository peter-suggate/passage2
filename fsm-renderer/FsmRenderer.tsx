import React from "react";
import ReactFlow, { useEdgesState, useNodesState } from "react-flow-renderer";
import styles from "./FsmRenderer.module.css";
import { MachineNode } from "./MachineNode";
import { PromiseNode } from "./PromiseNode";
import { StateNode } from "./StateNode";
import { TransitionNode } from "./TransitionNode";
import { CommandQueue } from "./CommandQueue";
import { graph } from "./model";
import { InvokeNode } from "./InvokeNode";

// fsm.send({ type: "instantiate", machine: menuMachine, parent: undefined });

// we define the nodeTypes outside of the component to prevent re-renderings
// you could also use useMemo inside the component
const nodeTypes = {
  machineNode: MachineNode,
  promiseNode: PromiseNode,
  invokeNode: InvokeNode,
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
  // const ref = React.createRef<HTMLDivElement>()

  // autoAnimate(
  //   document?.getElementsByClassName(
  //     "react-flow__nodes react-flow__container"
  //   )[0] as HTMLElement
  // );

  return (
    <div className={styles.container}>
      <div className={styles.fsm}>
        <ReactFlow
          className={styles.fsmRenderer}
          style={{ position: "absolute", height: `calc(100% - 120px)` }}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          // fitView
        />
      </div>
      <CommandQueue />
    </div>
  );
};

export default FsmRenderer;
