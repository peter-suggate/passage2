import { walkDogMachine } from "../examples/walkDogMachine";
import { machineTransitions } from "./fsm-transforms";

it("returns all transitions from one state to another within the machine", () => {
  expect(machineTransitions(walkDogMachine, { includeOnTransitions: true }))
    .toMatchInlineSnapshot(`
Array [
  Object {
    "name": "leave home",
    "source": "waiting",
    "target": "on a walk",
  },
  Object {
    "name": "leave home",
    "source": "walk complete",
    "target": "on a walk",
  },
]
`);
});
