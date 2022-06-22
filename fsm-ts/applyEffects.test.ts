import { applyEffects } from "./applyEffects";
import { applyTransition } from "./applyTransition";
import { createMachine } from "./createMachine";

const makeSubject = ({
  action1 = jest.fn(),
  action2 = jest.fn(),
  service1 = async () => 1,
  service2 = async () => 2,
  onService1Done = jest.fn(),
}) =>
  createMachine({
    initial: "state1",
    context: {
      processedActions: [],
    },
    states: {
      state1: {
        entry: "action1",
        invoke: {
          id: "service1",
          onDone: { target: "state2", actions: ["onService1Done"] },
          onError: { target: "error" },
        },
      },
      state2: {
        invoke: {
          id: "service2",
          onDone: { target: "state3" },
          onError: { target: "error" },
        },
      },
      state3: {
        type: "final",
      },
      error: {
        type: "final",
      },
    },
    actions: {
      action1: action1,
      action2: action2,
      onService1Done: onService1Done,
    },
    services: {
      service1: service1,
      service2: service2,
    },
  });

it("executes any actions, maintaining the machine's context", async () => {
  const machine = makeSubject({
    action1: jest.fn((context) => context.processedActions.push("action1")),
    action2: jest.fn((context) => context.processedActions.push("action2")),
    onService1Done: jest.fn((context) =>
      context.processedActions.push("onService1Done")
    ),
    service2: async () => {
      throw Error("Error executing service2");
    },
  });

  const state = applyTransition(machine)();

  const onSendEvent = jest.fn();

  const result = applyEffects(machine)(
    state,
    { processedActions: [] },
    { type: "event" },
    onSendEvent
  );

  expect(result.context.processedActions).toEqual(["action1"]);
  expect(result.spawnedServices).toHaveLength(1);

  await Promise.all(result.spawnedServices);
  expect(onSendEvent).toBeCalledWith({
    actions: ["onService1Done"],
    target: "state2",
    type: "onDone",
  });

  // Manually execute the transition returned via an event above.
  const state2 = applyTransition(machine)("state1", "onDone");
  const onSendEvent2 = jest.fn();
  const result2 = applyEffects(machine)(
    state2,
    result.context,
    { type: "onDone" },
    onSendEvent2
  );
  await Promise.all(result2.spawnedServices);
  expect(onSendEvent2).toBeCalledWith({ target: "error", type: "onError" });
});
