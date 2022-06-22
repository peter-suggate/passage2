import { createMachine } from "./createMachine";
import { createService } from "./createService";

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

it("supports invoking a promise service", async () => {
  const promiseService = jest.fn(async () => "promise result");
  const onDoneAction = jest.fn();

  const machine = createMachine({
    initial: "state",
    states: {
      state: {
        invoke: {
          id: "promiseService",
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

  await service.start();

  expect(promiseService).toBeCalledWith(
    { value: "context" },
    { type: "initial" }
  );
  expect(onDoneAction).toBeCalledWith({ value: "context" }, { type: "onDone" });

  expect(service.currentState.value).toBe("final");
});