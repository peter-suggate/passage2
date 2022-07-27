import { createMachine } from "./createMachine";
import { commandStore, fsmStore } from "./fsmStore";

it("supports processing all commands", () => {
  const commands = commandStore();
  const fsm = fsmStore(commands)();
  commands.send({
    type: "instantiate",
    machine: createMachine({ initial: "s", states: { s: { type: "final" } } }),
    parent: undefined,
  });
  commands.exhaust();
  expect(fsm.data().instances.size).toBe(1);
});

it("supports processing effects", async () => {
  const commands = commandStore();
  const fsm = fsmStore(commands)();
  commands.send({
    type: "instantiate",
    machine: createMachine({
      id: "machine",
      initial: "initial",
      states: {
        initial: {
          invoke: { src: "promiseService", onDone: { target: "final" } },
        },
        final: { type: "final" },
      },
      services: {
        promiseService: async () => "promise result",
      },
    }),
    parent: undefined,
  });
  commands.exhaust();
  expect(fsm.data().effects[0]).toMatchObject({
    id: "machine:promiseService",
    name: "promiseService",
    parent: "machine",
    status: "pending",
    // execute: jest.fn(),
  });
  await fsm.waitForAllEffects();
  commands.exhaust();
  // expect(fsm.data().effects[0]).toMatchObject({
  //   id: "machine:promiseService",
  //   name: "promiseService",
  //   parent: "machine",
  //   status: "settled",
  //   // execute: jest.fn(),
  // });
  expect(fsm.data().effects.length).toBe(0);
  expect(fsm.data().instances.get("machine")!.state.value).toBe("final");
});
