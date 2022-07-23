import ELK, { ElkNode } from "elkjs";
import { FsmCommandStore, FsmStore } from "../fsm-ts/fsm-store-types";
import { FsmListener, FsmSystemData } from "../fsm-ts/fsm-system-types";
import { ElkNodeWithMetadata } from "./fsm-render-types";
import { toMergedGraph, toReactFlow } from "./fsm-render-util";
import { toElkGraph } from "./toElkGraph";

type ElkGraphType = ElkNodeWithMetadata;
type OutGraphType = ReturnType<typeof toReactFlow>;
type MergedGraphType = ReturnType<typeof toMergedGraph>;

const toLayout = async (graph: ElkGraphType) => {
  const elk = new ELK();

  const layout = await elk.layout(graph as ElkNode);

  //   console.log(JSON.stringify(layout, undefined, 2));

  return layout as ElkGraphType;
};

export const graphStore = (
  commandStore: FsmCommandStore,
  fsmStore: FsmStore
) => {
  let snapshot: OutGraphType = { nodes: [], edges: [] };

  let listeners: FsmListener[] = [];

  const subscribeImpl = (subscription: FsmListener) => {
    listeners = listeners
      .filter((cur) => cur !== subscription)
      .concat(subscription);

    subscription({ type: "latest" } as any, fsmStore.data());

    return () => {
      listeners = listeners.filter((cur) => cur !== subscription);
    };
  };

  let prevLayout: MergedGraphType | undefined;

  const updateImpl = async (event: any, latest: FsmSystemData) => {
    // prevLayout = snapshot;
    const layout = await toLayout(toElkGraph(commandStore.send)(latest));

    const graph = toMergedGraph(layout, prevLayout);

    snapshot = toReactFlow(graph);

    listeners.forEach((l) => l(event, latest));

    prevLayout = graph;
  };

  fsmStore.subscribe(updateImpl);

  updateImpl({} as any, fsmStore.data());

  return {
    subscribe: subscribeImpl,
    getSnapshot: () => snapshot,
  };
};
