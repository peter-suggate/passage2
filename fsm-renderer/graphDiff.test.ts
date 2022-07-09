import type { GraphChangeDescription } from "./fsm-render-types";
import { graphDiff } from "./graphDiff";

it("returns empty graph", () => {
  expect(graphDiff([], [])).toEqual([]);
});

const n = (id: string) => ({ id });
const g = (ids: string[]) => ids.map((id) => ({ id }));

const cd = (changeType: GraphChangeDescription["changeType"]) => ({
  changeType,
});

it("returns no change when graph nodes match", () => {
  expect(graphDiff([], [])).toMatchObject([]);

  expect(graphDiff(g(["node"]), g(["node"]))).toMatchObject([cd("no-change")]);

  expect(graphDiff(g(["a", "b"]), g(["a", "b"]))).toMatchObject([
    cd("no-change"),
    cd("no-change"),
  ]);

  expect(
    graphDiff([n("2"), n("1"), n("0")], [n("0"), n("1"), n("2")])
  ).toMatchObject([cd("no-change"), cd("no-change"), cd("no-change")]);
});

it("uses added change type for nodes found in current, not in previous", () => {
  expect(graphDiff(g(["a", "b"]), [n("b")])).toMatchObject([
    cd("added"),
    cd("no-change"),
  ]);
});

it("includes removed nodes", () => {
  expect(graphDiff(g(["b"]), g(["a", "b", "c"]))).toMatchObject([
    { id: "a", changeType: "removed" },
    { id: "c", changeType: "removed" },
    { id: "b", changeType: "no-change" },
  ]);

  expect(graphDiff(g(["b"]), g(["a"]))).toMatchObject([
    { id: "a", changeType: "removed" },
    { id: "b", changeType: "added" },
  ]);
});
