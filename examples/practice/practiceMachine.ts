import { createMachine } from "../../fsm-ts/createMachine";

export const practiceMachine = createMachine({
  id: "practice session",
  initial: "preparing audio",
  states: {
    "preparing audio": {
      invoke: {
        onDone: { target: "listening" },
        src: "prepareAudio",
      },
    },
    listening: {
      on: {
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
});
