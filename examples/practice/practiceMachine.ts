import { createMachine } from "../../fsm-ts/createMachine";
import { sleep } from "../../fsm-ts/fsm-core-util";
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
      invoke: {
        src: "notes generator",
        onDone: { target: "finishing" },
        onError: { target: "finishing" },
      },
      on: {
        "note detected": {
          // target: "listening",
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
    prepareAudio: async (
      context: Context,
      event: FsmEvent,
      send?: (transitionName: string, value?: any) => void
    ) => {
      // console.log("TODO implement prepare audio");
      // console.log(send);
    },
    "notes generator": (
      context: Context,
      event: FsmEvent,
      send?: (transitionName: string, value?: any) => void
    ) => {
      return new Promise((res) => {
        window.onkeydown = (e) => {
          console.log(e);
          send && send("note detected", e.key);
        };
      });
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
