import { createMachine } from "./createMachine";
import { createService } from "./createService";
import { FsmEvent } from "./fsm-types";

it("has expected initial state", () => {
  const machine = createMachine({
    initial: "state",
    states: {
      state: {},
    },
  });

  const service = createService(machine);

  expect(service.currentState).toEqual({
    context: undefined,
    value: "state",
    spawnedServices: [],
  });
});

it("updates current state upon transition", () => {
  const machine = createMachine({
    initial: "state1",
    states: {
      state1: {
        on: {
          transition: { target: "state2" },
        },
      },
      state2: {},
    },
  });

  const service = createService(machine);

  service.transition("transition");

  expect(service.currentState.value).toBe("state2");
});

it("invokes actions upon state entry and exit", async () => {
  const state1Entry = jest.fn();
  const state1Exit = jest.fn();
  const state2Entry = jest.fn();

  const machine = createMachine({
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
    context: { value: "context" },
  });

  const service = createService(machine);

  await service.start();
  expect(state1Entry).toBeCalledWith({ value: "context" }, { type: "initial" });

  await service.transition("transition");
  expect(state1Exit).toBeCalledWith(
    { value: "context" },
    { type: "transition" }
  );
  expect(state2Entry).toBeCalledWith(
    { value: "context" },
    { type: "transition" }
  );
  expect(service.currentState.value).toBe("state2");
});

const promiseObject = new Promise((res) => res(undefined));

it("supports invoking a promise service", async () => {
  const promiseService = jest.fn(async () => "promise result");
  const onDoneAction = jest.fn();

  const machine = createMachine({
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

  const service = createService(machine);

  const listener = jest.fn();
  service.subscribe(listener);

  service.start();

  expect(listener).toBeCalledWith({
    newState: {
      context: { value: "context" },
      spawnedServices: [
        { id: "promiseService", promise: promiseObject, status: "pending" },
      ],
      value: "state",
    },
    prevState: {
      context: { value: "context" },
      spawnedServices: [],
      value: "state",
    },
    type: "state updated",
  });
  listener.mockClear();

  expect(promiseService).toBeCalledWith(
    { value: "context" },
    { type: "initial" }
  );

  await service.currentState.spawnedServices[0].promise;

  expect(onDoneAction).toBeCalledWith(
    { value: "context" },
    { type: "onDone", value: "promise result" }
  );

  expect(listener).toBeCalledWith({
    newState: {
      context: { value: "context" },
      spawnedServices: [],
      value: "final",
    },
    prevState: {
      context: { value: "context" },
      spawnedServices: [
        { id: "promiseService", promise: promiseObject, status: "settled" },
      ],
      value: "state",
    },
    type: "state updated",
  });
  listener.mockClear();

  expect(service.currentState.value).toBe("final");
});

it("supports invoking a machine service", async () => {
  type ChildContext = { fetched: string[] };

  const childMachine = createMachine({
    id: "child",
    initial: "retrieving todos",
    context: {
      fetched: [],
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
      "return fetched": (context: ChildContext) => context.fetched,
      "store fetched": (context: ChildContext, event: FsmEvent) => ({
        ...context,
        fetched: event.value,
      }),
    },
  });

  const machine = createMachine({
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
        todos: event.value,
      }),
    },
    context: { todos: [] },
  });

  const service = createService(machine);

  const spawnedServices = service.start();

  spawnedServices[0].service!.transition("retrieved", [
    "fetched todo",
    "another fetched todo",
  ]);

  await spawnedServices[0].promise;

  expect(service.currentState.value).toBe("final");
  expect(service.currentState.context.todos).toEqual([
    "fetched todo",
    "another fetched todo",
  ]);
});
