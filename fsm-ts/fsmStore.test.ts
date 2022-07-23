import { createMachine } from "./createMachine";
import { commandStore, fsmStore } from "./fsmStore";

it("", () => {
  const commands = commandStore();
  const fsm = fsmStore(commands)();
  commands.send({
    type: "instantiate",
    machine: createMachine({ initial: "s", states: { s: { type: "final" } } }),
    parent: undefined,
  });
  //   fsm.subscribe
  commands.exhaust();
  expect(fsm.data().instances.size).toBe(1);
});
