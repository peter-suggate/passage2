import ELK, { ElkNode } from "elkjs/lib/elk-api";
import { FsmCommandStore, FsmStore } from "../fsm-ts/fsm-store-types";
import { FsmListener, FsmSystemData } from "../fsm-ts/fsm-system-types";
import { ElkNodeWithMetadata } from "./fsm-render-types";
import { toMergedGraph, toReactFlow } from "./fsm-render-util";
import { toElkGraph } from "./toElkGraph";

type ElkGraphType = ElkNodeWithMetadata;
type OutGraphType = ReturnType<typeof toReactFlow>;
type MergedGraphType = ReturnType<typeof toMergedGraph>;

export const toLayout = async (graph: ElkGraphType) => {
  // const elk = new ELK();

  const ELK = require("elkjs/lib/elk-api.js");

  const elk = new ELK({
    workerFactory: function (url: any) {
      // the value of 'url' is irrelevant here
      const { Worker } = require("elkjs/lib/elk-worker.js"); // non-minified
      return new Worker(url);
    },
  });

  const layout = await elk.layout({
    ...graph,
    defaultLayoutOptions: {
      "org.eclipse.elk.layered.spacing.nodeNode": "150",
      "org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers": "100",
      "org.eclipse.elk.layered.spacing.baseValue": "100",
    },
    // edges: graph.edges?.slice(1),
  } as ElkNode);

  // console.log(JSON.stringify(layout, undefined, 2));

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
