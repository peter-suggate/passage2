import { createMachine } from "../../fsm-ts/createMachine";
import { sleep } from "../../fsm-ts/fsm-core-util";
import { FsmEvent } from "../../fsm-ts/fsm-types";

type Context = {
  piece: string | undefined;
  list: string[];
};

const PIECES = [
  "twinkle",
  "french folk song",
  "lightly row",
  "song of the wind",
];

export const chooseRandomPieceMachine = createMachine({
  id: "Random Chooser",
  initial: "fetching list",
  context: { piece: undefined, list: [] } as Context,
  states: {
    "fetching list": {
      invoke: {
        src: "fetchList",
        onDone: {
          target: "choosing random",
          actions: ["store list"],
        },
        onError: {
          target: "returning piece",
        },
      },
    },
    "choosing random": {
      invoke: {
        src: "generate",
        onDone: {
          target: "found one",
          actions: ["store piece"],
        },
      },
    },
    "found one": {
      on: {
        accept: { target: "returning piece" },
        "choose another": { target: "choosing random" },
      },
    },
    "returning piece": {
      type: "final",
      data: "return piece",
    },
  },
  services: {
    fetchList: async () => {
      await sleep(200);
      return PIECES;
    },
    generate: async (context: Context) => {
      await sleep(200);
      return context.list[Math.floor(Math.random() * context.list.length)];
    },
  },
  actions: {
    "store list": (context: Context, event: FsmEvent) => {
      return {
        ...context,
        list: event.value,
      };
    },
    "return piece": (context: Context, event: FsmEvent) => {
      return context.piece;
    },
    "store piece": (context: Context, event: FsmEvent) => {
      return {
        ...context,
        piece: event.value,
      };
    },
  },
});
