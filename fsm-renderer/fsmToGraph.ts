import create from "zustand";
import { Edge, Node } from "react-flow-renderer";
import { AnyService } from "../fsm-ts/fsm-types";
import { buildGraph } from "./buildGraph";
import { buildServiceGraph } from "./buildServiceGraph";

interface GraphState {
  nodes: Node[];
  edges: Edge[];
  update: () => void;
}

export const makeFsmGraphStore = (service: AnyService) => {
  const initialGraph = { nodes: [], edges: [] };

  const store = create<GraphState>((set) => ({
    ...initialGraph,
    update: async () => {
      const graph = await buildServiceGraph(service);
      set(() => graph);
    },
  }));

  return store;
};
