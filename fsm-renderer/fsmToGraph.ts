import create from "zustand";
import { Edge, Node } from "react-flow-renderer";
import { AnyService } from "../fsm-ts/fsm-service-types";
import { buildServiceGraph } from "./buildServiceGraph";

interface GraphState {
  nodes: Node[];
  edges: Edge[];
}

type GraphAPI = GraphState & {
  updateRemoveOld: () => Promise<GraphState>;
  update: () => Promise<GraphState>;
};

// export const makeFsmGraphStore = (service: AnyService) => {
//   let previousGraph: GraphState = { nodes: [], edges: [] };

//   const store = create<GraphAPI>((set) => ({
//     ...previousGraph,
//     updateRemoveOld: async () => {
//       const graph = await buildServiceGraph(service);

//       const removedNodes = previousGraph.nodes.filter(
//         (existingNode) =>
//           !graph.nodes.some((newNode) => existingNode.id === newNode.id)
//       );
//       console.log(removedNodes);

//       previousGraph.nodes.forEach((node) => {
//         if (removedNodes.some((n) => n.id === node.id)) {
//           // node.data.removing = true;
//           node.data = { ...node.data, removing: true };
//         }
//       });

//       const result = { nodes: previousGraph.nodes, edges: previousGraph.edges };

//       set(() => result);

//       return result;
//     },
//     update: async () => {
//       const graph = await buildServiceGraph(service);

//       previousGraph = graph;
//       // const removedNodes = previousGraph.nodes.filter(
//       //   (existingNode) =>
//       //     !graph.nodes.some((newNode) => existingNode.id === newNode.id)
//       // );
//       // console.log(removedNodes);

//       // previousGraph.nodes.forEach((node) => {
//       //   if (removedNodes.some((n) => n.id === node.id)) {
//       //     node.data.removing = true;
//       //   }
//       // });

//       // set(() => ({ nodes: previousGraph.nodes, edges: previousGraph.edges }));

//       // window.setTimeout(() => {
//       set(() => graph);

//       return graph;
//       //   previousGraph = graph;
//       // }, 500);
//     },
//   }));

//   return store;
// };
