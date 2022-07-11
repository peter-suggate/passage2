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

export const chooseRandomPieceMachine = createMachine<Context>({
  id: "choose random piece",
  initial: "fetching list",
  context: { piece: undefined, list: [] },
  states: {
    "fetching list": {
      invoke: {
        src: "fetchList",
        onDone: {
          target: "choosing at random",
          actions: ["store list"],
        },
      },
    },
    "choosing at random": {
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
        accept: { target: "returning chosen piece" },
        "choose another": { target: "choosing at random" },
      },
    },
    "returning chosen piece": {
      type: "final",
      data: "return chosen piece",
    },
  },
  services: {
    fetchList: async () => {
      await sleep(2000);
      return PIECES;
    },
    generate: async (context: Context) => {
      await sleep(2000);
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
    "return chosen piece": (context: Context, event: FsmEvent) => {
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
