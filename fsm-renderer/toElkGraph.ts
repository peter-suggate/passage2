import { ElkEdge, LayoutOptions } from "elkjs";
import { DeepReadonly } from "../fsm-ts/fsm-core-types";
import type {
  AnyRunningMachine,
  FsmEffect,
  FsmCommand,
  FsmRunningMachine,
  FsmSystemData,
  FsmRunningMachines,
} from "../fsm-ts/fsm-system-types";
import {
  stateHasTransitions,
  stateTransitions,
} from "../fsm-ts/fsm-transforms";
import type { FsmOptions } from "../fsm-ts/fsm-types";
import type { ElkNodeWithMetadata } from "./fsm-render-types";
import {
  guessStateNodeDimensions,
  guessTransitionNodeDimensions,
  guessMachineNodeDimensions,
  nodeIdForState,
  nodeIdForTransition,
  transitionId,
  nodeIdForInvoke,
  guessInvokeNodeDimensions,
} from "./fsm-render-util";

const PADDING = 25;

const COMMON_LAYOUT: LayoutOptions = {
  "org.eclipse.elk.layered.spacing.baseValue": "10",
  // "org.eclipse.elk.layered.spacing.nodeNode": "150",
  // "org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers": "100",
};

const LAYOUT_OPTIONS: LayoutOptions = {
  // "elk.algorithm": "layered",
  // "elk.hierarchyHandling": "INCLUDE_CHILDREN",
  "elk.layered.considerModelOrder": "NODES_AND_EDGES",
  // "elk.layered.wrapping.strategy": "MULTI_EDGE",
  "elk.layered.nodePlacement.strategy": "SIMPLE",
  "elk.aspectRatio": "2",
  // "elk.direction": "RIGHT",
  // "elk.alignment": "CENTER",
  "elk.padding": `[top=${PADDING}, left=${PADDING}, right=${PADDING}, bottom=${PADDING}]`,
  "org.eclipse.elk.layered.spacing.baseValue": "100",

  // ...COMMON_LAYOUT,
  // "spacing.nodeNode": "50",
};

const nodesForEffect = (effect: FsmEffect): ElkNodeWithMetadata[] => {
  return [
    {
      id: effect.id,
      // labels: [{ text: machine.id, id: "machine" }],
      metadata: {
        type: "promise",
        promise: effect,
        label: effect.name,
        // instance: instance as unknown as AnyRunningMachine,
        //   state,
        // service: service as unknown as AnyService,
      },
      children: [],
      //   children: nodesForService(machine, state, onSpawnedServiceEncountered),
    },
    // ...spawnedServiceNodes,
  ];
};

const nodesForActiveStateTransitions =
  (send?: SendCommandFunc) =>
  <Options extends FsmOptions>(
    instance: FsmRunningMachine<Options>
  ): ElkNodeWithMetadata[] => {
    const { machine, state } = instance;

    if (!state.value) return [];

    const stateDefinition = machine.states[state.value];

    const options = {
      includeInvokeTransitions: false,
      includeOnTransitions: true,
    };

    if (stateHasTransitions(stateDefinition, options)) {
      const desiredMinSize = stateTransitions(
        state.value,
        stateDefinition,
        options
      ).reduce(
        (prev, cur) => ({
          width: Math.max(
            prev.width,
            guessTransitionNodeDimensions()(cur.name).width
          ),
          height: Math.max(
            prev.height,
            guessTransitionNodeDimensions()(cur.name).height
          ),
        }),
        {
          width: 0,
          height: 0,
        }
      );

      return stateTransitions(state.value, stateDefinition, options).map(
        (transition) => ({
          id: nodeIdForTransition(state.id, transition),
          metadata: {
            type: "transition",
            execute: () => {
              send &&
                send({
                  type: "transition",
                  id: instance.state.id,
                  name: transition.name,
                });
            },
            label: transition.name,
            target: transition.target,
          },
          layoutOptions: {
            ...COMMON_LAYOUT,
            "org.eclipse.elk.nodeSize.constraints": "MINIMUM_SIZE",
            "elk.alignment": "RIGHT",
            "org.eclipse.elk.nodeSize.minimum": `(${desiredMinSize.width},${desiredMinSize.height})`,
          },
        })
      );
    }

    return [];
  };

const nodesForActiveStateInvoke = <Options extends FsmOptions>(
  instance: FsmRunningMachine<Options>
): ElkNodeWithMetadata[] => {
  const { machine, state } = instance;

  if (!state.value) return [];

  const stateDefinition = machine.states[state.value];

  const { invoke } = stateDefinition;

  if (!invoke) return [];

  const minSize = guessInvokeNodeDimensions(stateDefinition);

  return [
    {
      id: nodeIdForInvoke(state.id, invoke.src),
      metadata: {
        type: "invoke",
        label: invoke.src,
      },
      layoutOptions: {
        ...COMMON_LAYOUT,
        "elk.algorithm": "box",
        "elk.hierarchyHandling": "INCLUDE_CHILDREN",
        "elk.padding": `[top=${30}, left=${15}, right=${15}, bottom=${15}]`,
        "org.eclipse.elk.nodeSize.constraints": "MINIMUM_SIZE",
        "org.eclipse.elk.nodeSize.minimum": `(${minSize.width},${minSize.height})`,
      },
      children: [...nodesForInvokeStateTransitions(instance)],
    },
  ];
};

const nodesForInvokeStateTransitions = <Options extends FsmOptions>(
  instance: FsmRunningMachine<Options>
): ElkNodeWithMetadata[] => {
  const { machine, state } = instance;

  if (!state.value) return [];

  const stateDefinition = machine.states[state.value];

  const options = {
    includeInvokeTransitions: true,
    includeOnTransitions: false,
  };

  if (!stateHasTransitions(stateDefinition, options)) return [];

  return stateTransitions(state.value, stateDefinition, options).map(
    (transition) => ({
      id: nodeIdForTransition(state.id, transition),
      metadata: {
        type: "transition",
        label: transition.name,
        target: transition.target,
      },
      layoutOptions: {
        ...COMMON_LAYOUT,
        // "elk.padding": `[top=${25}, left=${25}, right=${25}, bottom=${25}]`,
        "org.eclipse.elk.nodeSize.constraints": "MINIMUM_SIZE",
        "org.eclipse.elk.nodeSize.minimum": `(${
          guessTransitionNodeDimensions(true)(transition.name).width
        },${guessTransitionNodeDimensions(true)(transition.name).height})`,
      },
      // ...desiredMinSize,
    })
  );
};

// const edgesForActiveStateTransitions = <Options extends FsmOptions>(
//   instance: FsmRunningMachine<Options>
// ): ElkEdge[] => {
//   const { machine, state } = instance;

//   if (!state.value) return [];

//   const stateDefinition = machine.states[state.value];
//   if (stateHasTransitions(stateDefinition)) {
//     return stateTransitions(state.value, stateDefinition).map((transition) => ({
//       id: `e-${state.id}:${transition.name}`,
//       sources: [nodeIdForState(state.id, transition.source)],
//       targets: [nodeIdForTransition(state.id, transition)],
//     }));
//   }

//   return [];
// };

const nodesForActiveState =
  (send?: SendCommandFunc) =>
  <Options extends FsmOptions>(
    instance: FsmRunningMachine<Options>
  ): ElkNodeWithMetadata[] => {
    const { machine, state } = instance;

    if (!state.value) return [];

    const stateDefinition = machine.states[state.value];

    const desiredMinSize = guessStateNodeDimensions(
      state.value,
      stateDefinition
    );

    return [
      {
        id: `${state.id}:${state.value}`,
        metadata: {
          type: "state",
          value: state.value,
          label: state.value,
          definition: stateDefinition,
          hidden: true,
        },
        layoutOptions: {
          ...COMMON_LAYOUT,
          "elk.algorithm": "box",
          "elk.hierarchyHandling": "INCLUDE_CHILDREN",
          "org.eclipse.elk.nodeSize.constraints": "MINIMUM_SIZE",
          "org.eclipse.elk.nodeSize.minimum": `(${desiredMinSize.width},${desiredMinSize.height})`,
          "elk.padding": `[top=${40}, left=${20}, right=${20}, bottom=${20}]`,
        },
        children: [
          ...nodesForActiveStateInvoke(instance),
          ...nodesForActiveStateTransitions(send)(instance),
          // ...nodesForInvokeStateTransitions(instance),
        ],
        ...guessStateNodeDimensions(state.value, stateDefinition),
      },
    ];
  };

const nodesForRunningMachine =
  (send?: SendCommandFunc) =>
  <Options extends FsmOptions>(
    instance: FsmRunningMachine<Options>
  ): ElkNodeWithMetadata[] => {
    const { desiredMinSize, padding } = guessMachineNodeDimensions(instance);

    return [
      {
        id: instance.state.id,
        metadata: {
          type: "machine",
          label: instance.machine.id,
          instance: instance as unknown as AnyRunningMachine,
        },
        layoutOptions: {
          ...COMMON_LAYOUT,
          "elk.algorithm": "layered",
          "org.eclipse.elk.nodeSize.constraints": "MINIMUM_SIZE",
          "org.eclipse.elk.nodeSize.minimum": `(${desiredMinSize.width},${desiredMinSize.height})`,
          "elk.padding": `[top=${padding.top}, left=${padding.left}, right=${padding.right}, bottom=${padding.bottom}]`,
        },
        children: [
          ...nodesForActiveState(send)(instance),
          // ...nodesForActiveStateTransitions(send)(instance),
        ],
        // edges: edgesForActiveStateTransitions(instance),
      },
    ];
  };

// const edgesForRunningMachine = <Options extends FsmOptions>(
//   instance: FsmRunningMachine<Options>
// ): ElkEdge[] => {
//   const { machine, state } = instance;

//   if (!state.value) return [];

//   const id = state.value;

//   const stateDefinition = machine.states[id];

//   if (!stateHasTransitions(stateDefinition)) return [];

//   return [
//     ...stateTransitions(id, stateDefinition).flatMap((transition) => [
//       {
//         id: transitionId(state.id, transition, "in"),
//         sources: [nodeIdForState(state.id, transition.source)],
//         targets: [nodeIdForTransition(state.id, transition)],
//       },
//       //   {
//       //     id: `${nodeIdForTransition(machine.id, transition)}-out`,
//       //     sources: [nodeIdForTransition(machine.id, transition)],
//       //     targets: [`${machine.id}-${transition.target}`],
//       //   },
//     ]),
//   ];
// };

const edgeToRunningMachineFromParent =
  (instances: FsmRunningMachines) =>
  <Options extends FsmOptions>(
    instance: FsmRunningMachine<Options>
  ): ElkEdge[] => {
    if (instance.state.parent) {
      const parentInstance = instances.get(instance.state.parent)!;

      return [
        {
          id: `e-${instance.state.parent}-${instance.state.id}`,
          sources: [
            // parentInstance.state.id,
            // nodeIdForState(parentInstance.state.id, parentInstance.state.value),
            nodeIdForInvoke(
              parentInstance.state.id,
              parentInstance.machine.states[parentInstance.state.value].invoke!
                .src
            ),
          ],
          targets: [instance.state.id],
        } as ElkEdge,
      ];
    }

    return [];
  };

const edgeToEffectFromParent =
  (instances: FsmRunningMachines) =>
  (effect: FsmEffect): ElkEdge[] => {
    const parentInstance = instances.get(effect.parent)!;

    const edges = [
      {
        id: `e-${effect.id}`,
        sources: [nodeIdForInvoke(parentInstance.state.id, effect.name)],
        targets: [effect.id],
      } as ElkEdge,
    ];

    if (effect.status === "settled") {
      const transitionType = effect.result === "success" ? "onDone" : "onError";
      edges.push(
        {
          id: `e-${effect.id}-${transitionType}`,
          sources: [effect.id],
          targets: [
            nodeIdForTransition(parentInstance.state.id, {
              name: transitionType,
              source: parentInstance.state.value,
            }),
          ],
        } as ElkEdge

        //   {
        //     id: `e-${effect.id}-onError`,
        //     sources: [
        //       // parentInstance.state.id,
        //       effect.id,
        //       // nodeIdForInvoke(parentInstance.state.id, effect.name),
        //     ],
        //     targets: [
        //       nodeIdForTransition(parentInstance.state.id, {
        //         name: "onError",
        //         source: parentInstance.state.value,
        //       }),
        //     ],
        //   } as ElkEdge,
        // ]
      );
    }

    return edges;
  };

type SendCommandFunc = <Options extends FsmOptions>(
  commandOrCommands: DeepReadonly<FsmCommand<Options>>
  // | FsmCommand<Options>[]
) => void;

export const toElkGraph =
  <Options extends FsmOptions>(send?: SendCommandFunc) =>
  (system: FsmSystemData): ElkNodeWithMetadata => {
    // export const toElkGraph = () => (system: FsmSystemData): ElkNodeWithMetadata => {
    const graph: ElkNodeWithMetadata = {
      id: "root",
      layoutOptions: LAYOUT_OPTIONS,
      metadata: { type: "root" },
      children: [
        ...Array.from(system.instances.values()).flatMap(
          nodesForRunningMachine(send)
        ),
        ...system.effects.flatMap(nodesForEffect),
      ],
      edges: [
        ...Array.from(system.instances.values()).flatMap(
          edgeToRunningMachineFromParent(system.instances)
        ),
        ...system.effects.flatMap(edgeToEffectFromParent(system.instances)),
        // ...Array.from(system.instances.values()).flatMap(
        //   edgesForRunningMachine
        // ),
      ],
    };

    return graph;
  };
