import { createMachine } from "../fsm-ts/createMachine";

export const walkDogMachine = createMachine({
  id: "walk dog",

  initial: "waiting",

  states: {
    waiting: {
      on: {
        "leave home": { target: "on a walk" },
      },
    },
    "on a walk": {
      invoke: {
        src: "on a walk",
        onDone: {
          target: "walk complete",
        },
        onError: {
          target: "walk complete",
        },
      },
      //   on: {
      //     "arrive home": { target: "walk complete" },
      //   },
    },
    "walk complete": {
      on: {
        "leave home": {
          target: "on a walk",
        },
      },
      //   type: "final",
    },
  },
  services: {
    "on a walk": createMachine({
      initial: "walking",
      states: {
        walking: {
          on: {
            "speed up": {
              target: "running",
            },
            stop: {
              target: "stopping to sniff good smells",
            },
            "walk finished": {
              target: "arrive home",
            },
          },
        },
        running: {
          on: {
            "sudden stop": {
              target: "stopping to sniff good smells",
            },
            "slow down": {
              target: "walking",
            },
            "walk finished": {
              target: "arrive home",
            },
          },
        },
        "stopping to sniff good smells": {
          on: {
            "speed up": {
              target: "walking",
            },
            "sudden speed up": {
              target: "running",
            },
          },
        },
        "arrive home": {
          type: "final",
        },
      },
    }),
  },
});
