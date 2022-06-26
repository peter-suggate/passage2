import create from "zustand";
import { Edge, Node } from "react-flow-renderer";
import { AnyService } from "../fsm-ts/fsm-types";
import { buildGraph } from "./buildGraph";

interface GraphState {
  nodes: Node[];
  edges: Edge[];
  update: () => void;
}

export const makeFsmGraphStore = (service: AnyService) => {
  const initialGraph = buildGraph(service);

  const store = create<GraphState>((set) => ({
    ...initialGraph,
    update: () => set(() => buildGraph(service)),
  }));

  return store;
};
