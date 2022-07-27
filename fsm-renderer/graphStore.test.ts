import { pipe } from "fp-ts/lib/function";
import { menuMachine } from "../examples/practice/menuMachine";
import { createMachine } from "../fsm-ts/createMachine";
import { sleep } from "../fsm-ts/fsm-core-util";
import { FsmRep } from "../fsm-ts/fsm-system-types";
import { FsmEvent } from "../fsm-ts/fsm-types";
import { commandStore, fsmStore } from "../fsm-ts/fsmStore";
import { command, emptySystem, exhaust } from "../fsm-ts/fsmSystem";
import { graphStore, toLayout } from "./graphStore";
import { toElkGraph } from "./toElkGraph";

const empty: FsmRep = [emptySystem(), []];

it("works", async () => {
  const fsm = pipe(
    empty,
    command({ type: "instantiate", machine: menuMachine }),
    command({
      type: "transition",
      id: "Passage",
      name: "free practice",
    }),
    exhaust()
  )[0];

  const graph = toElkGraph()(fsm);
  console.log(
    JSON.stringify(
      graph.children?.map((c) => c.id),
      undefined,
      2
    ),
    JSON.stringify(graph.edges, undefined, 2)
  );
  const thing = await toLayout({ ...graph, edges: graph.edges?.slice(1) });
});

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
    state2: {
      on: { transition: { target: "state3" } },
    },
    state3: { type: "final" },
  },
});

it("", async () => {
  const commands = commandStore();
  const fsm = fsmStore(commands)(emptySystem());
  const store = graphStore(commands, fsm);

  const listener = jest.fn((e) => {
    // console.warn(fsm.data());
    console.warn(store.getSnapshot());
  });

  store.subscribe(listener);
  //   expect(listener).toBeCalledWith({ type: "initial" });
  //   listener.mockClear();

  commands.send({ type: "instantiate", machine, parent: undefined });
  commands.exhaust();
  await sleep(1000);

  //   expect(listener).toBeCalledWith();
  //   listener.mockClear();
});

it.only("supports invoking a (child) machine", async () => {
  type ChildContext = { fetched: string[] };

  const childMachine = createMachine({
    id: "child",
    initial: "retrieving todos",
    context: {
      fetched: [] as string[],
    },
    states: {
      "retrieving todos": {
        on: {
          retrieved: {
            target: "returning todos",
            actions: ["store fetched"],
            // value: ["fetched todo", "another fetched todo"],
          },
        },
      },
      "returning todos": {
        type: "final",
        data: "return fetched",
      },
    },
    actions: {
      "return fetched": (context: ChildContext) => ({
        ...context,
        fetched: context.fetched,
      }),
      "store fetched": (context: ChildContext, event: FsmEvent) => ({
        ...context,
        fetched: event.value,
      }),
    },
  });

  const parentMachine = createMachine({
    id: "parent",
    initial: "loading",
    states: {
      loading: {
        invoke: {
          src: "childMachine",
          onDone: {
            target: "final",
            actions: ["store fetched todos from child"],
          },
        },
      },
      final: {
        type: "final",
      },
    },
    services: {
      childMachine,
    },
    actions: {
      "store fetched todos from child": (context: any, event: FsmEvent) => ({
        ...context,
        todos: event.value.fetched,
      }),
    },
    context: { todos: [] },
  });

  const TODOS = ["fetched todo", "another fetched todo"];

  const commands = commandStore();
  const fsm = fsmStore(commands)(emptySystem());
  const store = graphStore(commands, fsm);

  commands.send({ type: "instantiate", machine: parentMachine });
  commands.send({
    type: "transition",
    id: "child",
    name: "retrieved",
    value: TODOS,
  });
  commands.exhaust();

  // let result = pipe(
  //   empty,
  //   command({ type: "instantiate", machine: parentMachine }),
  //   command({
  //     type: "transition",
  //     id: "child",
  //     name: "retrieved",
  //     value: TODOS,
  //   }),
  //   exhaust()
  // );

  // expect(result[0].instances.get("parent")?.state).toMatchObject({
  //   context: {
  //     todos: TODOS,
  //   },
  // });
});
