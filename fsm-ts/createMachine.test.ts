import { createMachine } from "./createMachine";

it("throws error when no initial state is defined", () => {
  expect(() =>
    createMachine({
      states: {
        state: {},
      },
    })
  ).toThrowErrorMatchingInlineSnapshot(`
"No initial state defined. Expecting:
{
  initial: 'state'
  ...
}
"
`);
});
