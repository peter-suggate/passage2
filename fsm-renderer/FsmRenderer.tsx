import ReactFlow from "react-flow-renderer";
import styles from "./FsmRenderer.module.css";
import { createMachine } from "../fsm-ts/createMachine";
import { createService } from "../fsm-ts/createService";
import { MachineNode } from "./MachineNode";
import { PromiseNode } from "./PromiseNode";
import { makeFsmGraphStore } from "./fsmToGraph";

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

const useTodosGraph = makeFsmGraphStore(todosService);

export const FsmRenderer = () => {
  const { nodes, edges, update } = useTodosGraph();

  todosService.subscribe((event) => {
    console.log(event);
    update();
  });

  return (
    <ReactFlow
      className={styles.fsmRenderer}
      style={{ position: "absolute" }}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
    />
  );
};
