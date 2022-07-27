import { createMachine } from "./createMachine";
import { runMachine } from "./runMachine";

it("initializes the running machine with its initial state and context", () => {
  const runningMachine = runMachine(
    createMachine({
      id: "machine",
      initial: "state",
      context: { value: "initial context value" },
      states: {
        state: {},
      },
    }),
    undefined
  );

  expect(runningMachine.state).toEqual({
    parent: null,
    context: { value: "initial context value" },
    id: "machine",
    children: new Map(),
    value: null,
  });
});
