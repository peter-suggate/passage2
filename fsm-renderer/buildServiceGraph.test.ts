import { createMachine } from "../fsm-ts/createMachine";
import { createService } from "../fsm-ts/createService";
import { edgesForService, nodesForService } from "./buildServiceGraph";

it("includes active state and all of its transitions", () => {
  const service = createService(
    createMachine({
      id: "m",
      initial: "s1",
      states: {
        s1: { on: { t1: { target: "s2" }, t2: { target: "s3" } } },
        s2: { on: { t2: { target: "s3" } } },
        s3: { type: "final" },
      },
    })
  );

  expect(nodesForService(service)).toMatchObject([
    { id: "m:s1" },
    { id: "m:s1:t1" },
    { id: "m:s1:t2" },
  ]);

  expect(edgesForService(service)).toMatchObject([
    {
      id: "m:s1:t1:in",
      sources: ["m:s1"],
      targets: ["m:s1:t1"],
    },
    {
      id: "m:s1:t2:in",
      sources: ["m:s1"],
      targets: ["m:s1:t2"],
    },
  ]);

  service.transition("t1");

  expect(nodesForService(service)).toMatchObject([
    { id: "m:s2" },
    { id: "m:s2:t2" },
  ]);

  service.transition("t2");

  expect(nodesForService(service)).toMatchObject([{ id: "m:s3" }]);
});
