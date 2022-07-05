import { walkDogMachine } from "../examples/walkDogMachine";
import { createMachine } from "../fsm-ts/createMachine";
import { createService } from "../fsm-ts/createService";
import {
  buildMachineInternalGraph,
  edgesForMachine,
  nodesForMachine,
} from "./buildGraph";

describe("building a machine's internal graph", () => {
  test("", () => {
    expect(
      nodesForMachine(
        createMachine({
          id: "m",
          initial: "state",
          states: {
            state: {},
          },
        })
      )
    ).toMatchObject([
      {
        children: [],
        id: "m-state",
      },
    ]);
  });

  test("includes transition nodes", () => {
    const machine = createMachine({
      id: "m",
      initial: "state1",
      states: {
        state1: {
          on: { transition: { target: "state2" } },
        },
        state2: {
          type: "final",
        },
      },
    });

    expect(nodesForMachine(machine)).toMatchObject([
      { id: "m-state1" },
      { id: "m-state2" },
      { id: "m-transition" },
    ]);

    expect(edgesForMachine(machine)).toMatchObject([
      {
        id: "m-transition-in",
        sources: ["m-state1"],
        targets: ["m-transition"],
      },
      {
        id: "m-transition-out",
        sources: ["m-transition"],
        targets: ["m-state2"],
      },
    ]);
  });

  test("includes nodes for any child machine", () => {
    const machine = createMachine({
      id: "parent",
      initial: "state",
      states: {
        state: {
          type: "final",
          invoke: {
            src: "childMachine",
          },
        },
      },
      services: {
        childMachine: createMachine({
          id: "child",
          initial: "state",
          states: {
            state: { type: "final" },
          },
        }),
      },
    });

    expect(nodesForMachine(machine)).toMatchObject([
      {
        id: "parent-state",
        children: [
          {
            id: "child-state",
            children: [],
          },
        ],
      },
    ]);

    expect(edgesForMachine(machine)).toMatchObject([]);
  });

  test("includes edges between any child machine internal nodes", () => {
    const machine = createMachine({
      id: "parent",
      initial: "state",
      states: {
        state: {
          type: "final",
          invoke: {
            src: "childMachine",
          },
        },
      },
      services: {
        childMachine: createMachine({
          id: "child",
          initial: "state1",
          states: {
            state1: {
              on: {
                transition: { target: "state2" },
              },
            },
            state2: { type: "final" },
          },
        }),
      },
    });

    expect(nodesForMachine(machine)).toMatchObject([
      {
        id: "parent-state",
        children: [
          {
            id: "child-state1",
            children: [],
          },
          {
            id: "child-state2",
            children: [],
          },
          {
            id: "child-transition",
          },
        ],
      },
    ]);

    expect(edgesForMachine(machine)).toMatchObject([
      {
        id: "child-transition-in",
        sources: ["child-state1"],
        targets: ["child-transition"],
      },
      {
        id: "child-transition-out",
        sources: ["child-transition"],
        targets: ["child-state2"],
      },
    ]);
  });

  test("includes onDone and onError transitions for states that invoke a service", () => {
    const machine = createMachine({
      id: "m",
      initial: "state",
      states: {
        state: {
          invoke: {
            src: "promiseService",
            onDone: { target: "done" },
            onError: { target: "error" },
          },
        },
        done: {
          type: "final",
        },
        error: {
          type: "final",
        },
      },
      services: {
        promiseService: async () => {},
      },
    });

    expect(nodesForMachine(machine)).toMatchObject([
      { id: "m-state" },
      { id: "m-done" },
      { id: "m-error" },
      { id: "m-state-onDone" },
      { id: "m-state-onError" },
    ]);

    expect(edgesForMachine(machine)).toMatchObject([
      {
        id: "m-state-onDone-in",
        sources: ["m-state"],
        targets: ["m-transition"],
      },
      {
        id: "m-transition-out",
        sources: ["child-transition"],
        targets: ["child-state2"],
      },
    ]);
  });
});

describe("building representation of machine ready for rendering", () => {
  const machine = createMachine({
    id: "parent",
    initial: "state",
    states: {
      state: {
        type: "final",
        invoke: {
          src: "childMachine",
        },
      },
    },
    services: {
      childMachine: createMachine({
        id: "child",
        initial: "state",
        states: {
          state: { type: "final" },
        },
      }),
    },
  });

  xit("works", async () => {
    const service = createService(machine);

    const { nodes, edges } = await buildMachineInternalGraph(service);

    expect(nodes).toMatchObject([]);
  });
});
