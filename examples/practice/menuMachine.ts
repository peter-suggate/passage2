import { createMachine } from "../../fsm-ts/createMachine";
import { FsmEvent } from "../../fsm-ts/fsm-types";
import { chooseRandomPieceMachine } from "./chooseRandomPieceMachine";
import { practiceMachine } from "./practiceMachine";

type Context = {
  piece: string | undefined;
};

export const menuMachine = createMachine({
  id: "passage app",
  context: {
    piece: undefined,
  },
  initial: "presenting options",
  states: {
    "presenting options": {
      on: {
        "free practice": { target: "practicing" },
        "random piece": { target: "choosing random piece" },
        "current piece": { target: "practicing" },
      },
    },
    practicing: {
      invoke: {
        src: "practice",
        onDone: { target: "presenting options" },
      },
    },
    "choosing random piece": {
      invoke: {
        src: "random piece chooser",
        onDone: { target: "practicing", actions: ["store chosen piece"] },
      },
    },
  },
  services: {
    promiseService: async () => {},
    practice: practiceMachine,
    "random piece chooser": chooseRandomPieceMachine,
  },
  actions: {
    "store chosen piece": (context: Context, event: FsmEvent) => {
      return {
        ...context,
        piece: event.value,
      };
    },
  },
});
