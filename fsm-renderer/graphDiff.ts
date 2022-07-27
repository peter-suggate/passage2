import type { GraphChangeDescription } from "./fsm-render-types";

export const graphDiff = <T extends { id: string }>(
  current: T[],
  previous: T[]
): (T & GraphChangeDescription)[] => {
  const removed = previous
    .filter((p) => !current.some((c) => c.id === p.id))
    .map(
      (c) => ({ ...c, changeType: "removed" } as T & GraphChangeDescription)
    );

  return [
    // ...removed,
    ...current.map((c) => {
      const inPrevious = previous.some((p) => p.id === c.id);

      return { ...c, changeType: !inPrevious ? "added" : "no-change" } as T &
        GraphChangeDescription;
    }),
  ];
};
