import { createMachine } from "../fsm-ts/createMachine";
import { sleep } from "../fsm-ts/fsm-core-util";
import { FsmEvent } from "../fsm-ts/fsm-types";

type Context = { todos: string[] };

export const todosMachine = createMachine({
  initial: "loading",
  context: {
    todos: [],
  },
  states: {
    loading: {
      invoke: {
        src: "loadTodos",
        onDone: { target: "displaying", actions: ["onTodosLoaded"] },
        onError: { target: "showing error" },
      },
    },
    displaying: {
      on: {
        "add todo": { target: "displaying", actions: ["addTodo"] },
      },
    },
    "showing error": {
      type: "final",
    },
  },
  actions: {
    onTodosLoaded: (context: Context, event: FsmEvent) => ({
      ...context,
      todos: event.value,
    }),
    addTodo: (context: Context, event: FsmEvent) => ({
      ...context,
      todos: [...context.todos, event.value],
    }),
  },
  services: {
    loadTodos: async () => {
      await sleep(2000);
      return ["Wash dishes", "Finish passage2", "Tidy room"];
    },
  },
});
