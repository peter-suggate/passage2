import { applyTransition } from "./applyTransition";
import { createMachine } from "./createMachine";

it("has expected initial state", () => {
  const machine = createMachine({
    initial: "state1",
    services: {},
    states: {
      state1: {},
      state2: {},
    },
  });

  expect(machine.initial).toBe("state1");
});

describe("instantiating a machine", () => {
  it("produces a state containing expected initial value", () => {
    const machine = createMachine({
      initial: "state",
      actions: {},
      services: {},
      states: {
        state: {},
      },
      context: {},
    });

    const { value } = applyTransition(machine)();

    expect(value).toEqual("state");
  });

  it("returns any entry action or invoked service on the initial state", () => {
    const machine = createMachine({
      initial: "state",
      actions: {
        action: () => {},
      },
      services: {
        service: () => {},
      },
      states: {
        state: {
          entry: "action",
          invoke: {
            serviceId: "service",
          },
        },
      },
      context: {},
    });

    const { actions, services } = applyTransition(machine)();

    expect(actions).toEqual(["action"]);
    expect(services).toEqual([{ serviceId: "service" }]);
  });
});

describe("transitioning between states", () => {
  it("supports transitioning from one state to another", () => {
    const machine = createMachine({
      initial: "state1",
      states: {
        state1: { on: { transition: { target: "state2" } } },
        state2: { type: "final" },
      },
    });

    const apply = applyTransition(machine);

    const state = apply();

    expect(state.value).toBe("state1");

    expect(apply(state.value, "transition").value).toBe("state2");
  });

  it("records exit and enter actions during a transition", () => {
    const onExitState1 = jest.fn();
    const onEnterState1 = jest.fn();
    const onEnterState2 = jest.fn();

    const machine = createMachine({
      initial: "state1",
      actions: {
        onExitState1: onExitState1,
        onEnterState1: onEnterState1,
        onEnterState2: onEnterState2,
      },
      states: {
        state1: {
          on: { transition: { target: "state2" } },
          entry: "onEnterState1",
          exit: "onExitState1",
        },
        state2: { type: "final", entry: "onEnterState2" },
      },
    });

    const apply = applyTransition(machine);

    const state1 = apply();

    expect(state1.value).toBe("state1");
    expect(state1.actions).toEqual(["onEnterState1"]);

    const state2 = apply(state1.value, "transition");
    expect(state2.actions).toEqual(["onExitState1", "onEnterState2"]);
  });

  it("records actions to invoke upon entering a new state", () => {
    const onExitState1 = jest.fn();
    const onEnterState1 = jest.fn();
    const onEnterState2 = jest.fn();

    const machine = createMachine({
      initial: "state1",
      actions: {
        onExitState1: onExitState1,
        onEnterState1: onEnterState1,
        onEnterState2: onEnterState2,
      },
      states: {
        state1: {
          on: { transition: { target: "state2" } },
          entry: "onEnterState1",
          exit: "onExitState1",
        },
        state2: { type: "final", entry: "onEnterState2" },
      },
    });

    const apply = applyTransition(machine);
    const state1 = apply();

    expect(state1.value).toBe("state1");
    expect(state1.actions).toEqual(["onEnterState1"]);

    const state2 = apply(state1.value, "transition");
    expect(state2.actions).toEqual(["onExitState1", "onEnterState2"]);
  });

  it("adds an invocation of a child machine upon transition", () => {
    const onEnterChildMachine = jest.fn();
    const childMachine = createMachine({
      initial: "state1",
      states: {
        state1: {},
      },
      services: {
        onEnterChildMachine,
      },
    });

    const machine = createMachine({
      initial: "state1",
      services: {
        invokeChildMachine: childMachine,
      },
      states: {
        state1: {
          on: { transition: { target: "state2" } },
        },
        state2: {
          type: "final",
          invoke: {
            serviceId: "invokeChildMachine",
          },
        },
      },
    });

    const apply = applyTransition(machine);
    const state1 = apply();

    expect(state1.value).toBe("state1");

    const state2 = apply(state1.value, "transition");
    expect(state2.services).toEqual([{ serviceId: "invokeChildMachine" }]);
  });
});
