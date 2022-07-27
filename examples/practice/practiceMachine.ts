import { createMachine } from "../../fsm-ts/createMachine";
import { FsmEvent } from "../../fsm-ts/fsm-types";

type Context = {
  notes: string[];
};

export const practiceMachine = createMachine({
  id: "practice session",
  initial: "preparing audio",
  context: { notes: [] } as Context,
  states: {
    "preparing audio": {
      invoke: {
        onDone: { target: "listening" },
        src: "prepareAudio",
      },
    },
    listening: {
      on: {
        "note detected": {
          target: "listening",
          actions: ["add note"],
          value: "D",
        },
        finish: {
          target: "finishing",
        },
      },
    },
    finishing: {
      type: "final",
    },
  },
  services: {
    prepareAudio: async () => {
      console.log("TODO implement prepare audio");
    },
  },
  actions: {
    "add note": (context: Context, event: FsmEvent) => {
      console.log(context, event);
      return {
        ...context,
        notes: context.notes.concat(event.value),
      };
    },
  },
});
