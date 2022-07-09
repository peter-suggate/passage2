import { createMachine } from "./createMachine";
import { createService } from "./createService";
import { AnyServiceEvent } from "./fsm-service-types";
import type { FsmEvent } from "./fsm-types";

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
    spawnedServices: {},
  });
});

it("updates current state upon transition", async () => {
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

  await service.tick();

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

  service.start();
  await service.tick();

  expect(state1Entry).toBeCalledWith(
    { value: "context" },
    { type: "transition", name: null, value: "state1" }
  );

  const value = "transition value";

  service.transition("transition", value);
  await service.tick();

  expect(state1Exit).toBeCalledWith(
    { value: "context" },
    { type: "transition", name: "transition", value }
  );

  expect(state2Entry).toBeCalledWith(
    { value: "context" },
    { type: "transition", name: "transition", value }
  );

  expect(service.currentState.value).toBe("state2");
});

const promiseObject = new Promise((res) => res(undefined));

it("supports invoking a promise service", async () => {
  const promiseService = jest.fn(async () => "promise result");
  type Context = { value: string };
  const onDoneAction = jest.fn((context: Context, event: FsmEvent) => {
    return {
      ...context,
      value: event.value,
    };
  });

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

  await service.tick();

  expect(listener.mock.calls.map((c) => c[0])).toMatchObject([
    // Events for transitioning to initial event
    { type: "transition" },
    { type: "entering state", value: "state" },
    // Invoke service events upon enter initial state
    { type: "invoke service" },
    { type: "transitioned to new state" },
    { type: "service created" },
    {
      type: "service started",
      descriptor: { promise: promiseObject, status: "pending" },
    },
    { type: "service finished", result: "promise result" },
    { type: "transition", name: "onDone", value: "promise result" },
    { type: "execute actions", actions: ["onDoneAction"] },
    { type: "exiting state", value: "state" },
    { type: "entering state", value: "final" },
    {
      type: "transitioned to new state",
      // prevState: { context: { value: "context" } },
      newState: { context: { value: "promise result" } },
    },
  ]);

  expect(service.currentState.value).toBe("final");
});

it("supports invoking a (child) machine", async () => {
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

  const listener = jest.fn();
  service.subscribe(listener);

  service.start();
  await service.tick();

  expect(listener.mock.calls.map((c) => c[0])).toMatchObject([
    { type: "transition" },
    { type: "entering state", value: "loading" },
    { type: "invoke service" },
    { type: "transitioned to new state" },
    { type: "service created" },
    { type: "service started" },
    { type: "transition" },
    { type: "entering state", value: "retrieving todos" },
    { type: "transitioned to new state" },
  ]);

  const TODOS = ["fetched todo", "another fetched todo"];

  // TODO wrap into a helper to retrieve first spawned service
  const spawnedChildMachine = Object.values(
    service.currentState.spawnedServices
  )[0];
  spawnedChildMachine.status === "pending" &&
    spawnedChildMachine.service?.transition("retrieved", TODOS);

  // Control is now in the child machine. Parent is waiting for child to reach its final state.
  listener.mockClear();
  await service.tick();
  expect(listener.mock.calls.map((c) => c[0])).toMatchObject([
    {
      type: "transition",
      name: "retrieved",
      value: TODOS,
    },
    { type: "execute actions", actions: ["store fetched"] },
    { type: "exiting state", value: "retrieving todos" },
    { type: "entering state", value: "returning todos" },
    { type: "transitioned to new state" },
  ]);

  // Control returns to the parent machine.
  listener.mockClear();
  await service.tick();
  expect(listener.mock.calls.map((c) => c[0])).toMatchObject([
    { type: "service finished", result: TODOS },
    { type: "transition", name: "onDone", value: TODOS },
    { type: "execute actions", actions: ["store fetched todos from child"] },
    { type: "exiting state", value: "loading" },
    { type: "entering state", value: "final" },
    { type: "transitioned to new state" },
  ]);
});

describe("explicit stepping through changes to the service", () => {
  it("produces a step for each event during a simple transition", async () => {
    const machine = createMachine({
      initial: "s1",
      states: { s1: { on: { t: { target: "s2" } } }, s2: { type: "final" } },
    });

    const stepper = jest.fn(async (event: AnyServiceEvent) => {});

    const service = createService(machine, { stepper });

    const listener = jest.fn();
    service.subscribe(listener);

    service.start();

    service.transition("t");

    await service.tick();

    expect(stepper.mock.calls).toEqual(listener.mock.calls);
  });
});
