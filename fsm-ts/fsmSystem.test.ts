import { createMachine } from "./createMachine";
import { emptySystem, exhaust, command, commands } from "./fsmSystem";
import { FsmEvent } from "./fsm-types";
import { pipe } from "fp-ts/function";
import { FsmRep } from "./fsm-system-types";

it("an empty system has no running instances", () => {
  const system = emptySystem();

  expect(system.instances.size).toBe(0);
  expect(system.effects).toHaveLength(0);
});

const empty: FsmRep = [emptySystem(), []];

it("supports starting a running machine and processing events to get it into its initial state", async () => {
  // Terminology:
  // - command. Tells the system to do something. Is processed. Results in change to instances or yields events.
  // - event. Notification to listeners.
  // - effect. Async operation that will result one or more commands
  //
  // Philosophy:
  // - Want control over application of commands.
  //
  // An effect terminates with an optional event sent back to the interpreter.

  const result = pipe(
    empty,
    command({
      type: "instantiate",
      machine: createMachine({
        id: "machine",
        initial: "state",
        states: { state: {} },
      }),
    }),
    exhaust()
  );

  expect(result[0].instances.get("machine")?.state.value).toBe("state");
  expect(result[1]).toMatchObject([]);
});

it("updates current state upon transition", async () => {
  const machine = createMachine({
    id: "machine",
    initial: "state1",
    states: {
      state1: {
        on: {
          transition: { target: "state2" },
        },
      },
      state2: {
        type: "final",
      },
    },
  });

  const result = pipe(
    empty,
    command({ type: "instantiate", machine }),
    command({ type: "transition", id: "machine", name: "transition" }),
    exhaust()
  );

  expect(result[0].instances.get("machine")!.state.value).toBe("state2");
});

it("supports events that do not transition to a new state", async () => {
  const machine = createMachine({
    id: "machine",
    initial: "state",
    context: { value: "" },
    states: {
      state: {
        on: {
          event: { actions: ["action"] },
        },
      },
    },
    actions: {
      action: () => ({ value: "updated context" }),
    },
  });

  const result = pipe(
    empty,
    command({ type: "instantiate", machine }),
    command({
      type: "transition",
      id: "machine",
      name: "event",
    }),
    exhaust()
  );

  const instance = result[0].instances.get("machine")!;
  expect(instance.state.value).toBe("state");
  expect(instance.state.context).toEqual({
    value: "updated context",
  });
});

it("invokes actions upon state entry and exit", async () => {
  const state1Entry = jest.fn(() => ({ value: "state1Entry result" }));
  const state1Exit = jest.fn(() => ({ value: "state1Exit result" }));
  const state2Entry = jest.fn(() => ({ value: "state2Entry result" }));

  const machine = createMachine({
    id: "machine",
    initial: "state1",
    states: {
      state1: {
        on: {
          transition: { target: "state2" },
        },
        entry: "state1Entry",
        exit: "state1Exit",
      },
      state2: {
        entry: "state2Entry",
      },
    },
    actions: {
      state1Entry,
      state1Exit,
      state2Entry,
    },
    context: { value: "initial context" },
  });

  let result = pipe(
    empty,
    command({ type: "instantiate", machine }),
    exhaust()
  );

  expect(state1Entry).toBeCalledWith(
    { value: "initial context" },
    { type: "transition", id: "machine", name: null, value: undefined }
  );

  const value = "transition value";

  result = pipe(
    result,
    command({
      type: "transition",
      id: "machine",
      name: "transition",
      value,
    }),
    exhaust()
  );

  expect(state1Exit).toBeCalledWith(
    { value: "state1Entry result" },
    { type: "transition", id: "machine", name: "transition", value }
  );

  expect(state2Entry).toBeCalledWith(
    { value: "state1Exit result" },
    { type: "transition", id: "machine", name: "transition", value }
  );

  expect(result[0].instances.get("machine")!.state.value).toBe("state2");
});

// const promiseObject = new Promise((res) => res(undefined));

it("supports invoking a promise upon entering a state", async () => {
  const promiseService = jest.fn(async () => "promise result");
  type Context = { value: string };
  const onDoneAction = jest.fn((context: Context, event: FsmEvent) => {
    return {
      ...context,
      value: event.value,
    };
  });

  const machine = createMachine({
    id: "machine",
    initial: "state",
    states: {
      state: {
        invoke: {
          src: "promiseService",
          onDone: {
            target: "final",
            actions: ["onDoneAction"],
          },
        },
      },
      final: {
        type: "final",
      },
    },
    services: {
      promiseService,
    },
    actions: {
      onDoneAction,
    },
    context: { value: "context" },
  });

  let result = pipe(
    empty,
    command({ type: "instantiate", machine }),
    exhaust()
  );

  const effect = result[0].effects[0];
  if (effect.status !== "not started") throw Error();
  const childCommandsOnDone = await effect.execute(jest.fn());
  // const child = Array.from(
  //   result.instances.get("machine")!.state.children.values()
  // )[0];

  // const childCommandsOnDone =
  //   child.status === "pending" ? await child.promise : [];

  result = pipe(result, commands(childCommandsOnDone), exhaust());

  expect(result[0].instances.get("machine")!.state).toMatchObject({
    context: { value: "promise result" },
    value: "final",
  });

  expect(result[0].effects.length).toBe(0);
});

it("supports invoking a (child) machine", async () => {
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

  let result = pipe(
    empty,
    command({ type: "instantiate", machine: parentMachine }),
    command({
      type: "transition",
      id: "child",
      name: "retrieved",
      value: TODOS,
    }),
    exhaust()
  );

  expect(result[0].instances.get("parent")?.state).toMatchObject({
    context: {
      todos: TODOS,
    },
  });
});
