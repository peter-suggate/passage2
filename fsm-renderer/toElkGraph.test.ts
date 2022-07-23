import { pipe } from "fp-ts/lib/function";
import { createMachine } from "../fsm-ts/createMachine";
import { FsmRep } from "../fsm-ts/fsm-system-types";
import { command, emptySystem, exhaust } from "../fsm-ts/fsmSystem";
import { toElkGraph } from "./toElkGraph";

const toReadonlyElkGraph = toElkGraph();

const empty: FsmRep = [emptySystem(), []];

it("defines a node for active state plus any of its transitions", async () => {
  const machine = createMachine({
    id: "machine",
    initial: "state1",
    states: {
      state1: {
        on: {
          transition1: { target: "state2" },
          transition2: { target: "state3" },
        },
      },
      state2: { type: "final" },
      state3: { type: "final" },
    },
  });

  const [system] = pipe(
    empty,
    command({ type: "instantiate", machine }),
    exhaust()
  );

  expect(toReadonlyElkGraph(system)).toMatchObject({
    id: "root",
    children: [
      {
        id: "running-machine",
        children: [
          { id: "running-machine:state1" },
          { id: "running-machine:state1-transition1" },
          { id: "running-machine:state1-transition2" },
        ],
        edges: [
          {
            id: "e-running-machine:transition1",
            sources: ["running-machine:state1"],
            targets: ["running-machine:state1-transition1"],
          },
          {
            id: "e-running-machine:transition2",
            sources: ["running-machine:state1"],
            targets: ["running-machine:state1-transition2"],
          },
        ],
      },
    ],
  });
});

it("defines a top-level node for each running machine or promise as well as an edge back to any parent", async () => {
  const machine = createMachine({
    id: "parent",
    initial: "state",
    states: {
      state: {
        invoke: {
          src: "childMachine",
        },
      },
    },
    services: {
      childMachine: createMachine({
        id: "child",
        initial: "initial",
        states: {
          initial: {
            invoke: { src: "childPromise", onDone: { target: "final" } },
          },
          final: { type: "final" },
        },
        services: {
          childPromise: async () => {},
        },
      }),
    },
  });

  const [system] = pipe(
    empty,
    command({ type: "instantiate", machine }),
    exhaust()
  );

  expect(toReadonlyElkGraph(system)).toMatchObject({
    id: "root",
    children: [
      { id: "running-parent" },
      { id: "running-child" },
      { id: "running-child:childPromise" },
    ],
    edges: [
      {
        id: "e-running-parent-running-child",
        sources: ["running-parent"],
        targets: ["running-child"],
      },
      {
        id: "e-running-child:childPromise",
        sources: ["running-child"],
        targets: ["running-child:childPromise"],
      },
    ],
  });
});
