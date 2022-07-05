import React from "react";
import ReactFlow from "react-flow-renderer";
import styles from "./FsmRenderer.module.css";
import { createService } from "../fsm-ts/createService";
import { MachineNode } from "./MachineNode";
import { PromiseNode } from "./PromiseNode";
import { makeFsmGraphStore } from "./fsmToGraph";
import { menuMachine } from "../examples/practice/menuMachine";
import { StateNode } from "./StateNode";
import { TransitionNode } from "./TransitionNode";

const todosService = createService(menuMachine);
todosService.start();

// we define the nodeTypes outside of the component to prevent re-renderings
// you could also use useMemo inside the component
const nodeTypes = {
  machineNode: MachineNode,
  promiseNode: PromiseNode,
  stateNode: StateNode,
  transitionNode: TransitionNode,
};

const useTodosGraph = makeFsmGraphStore(todosService);

export const FsmRenderer = () => {
  const { nodes, edges, update } = useTodosGraph();

  React.useEffect(() => {
    update();

    const disposer = todosService.subscribe((event) => {
      update();
    });

    return disposer;
  }, [update]);

  return (
    <ReactFlow
      className={styles.fsmRenderer}
      style={{ position: "absolute" }}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      // fitView
    />
  );
};
