import { ElkEdge, LayoutOptions } from "elkjs";
import { DeepReadonly } from "../fsm-ts/fsm-core-types";
import type {
  AnyRunningMachine,
  FsmEffect,
  FsmCommand,
  FsmRunningMachine,
  FsmSystemData,
} from "../fsm-ts/fsm-system-types";
import { stateTransitions } from "../fsm-ts/fsm-transforms";
import { stateHasTransitions } from "../fsm-ts/fsm-type-guards";
import type { FsmOptions } from "../fsm-ts/fsm-types";
import type { ElkNodeWithMetadata } from "./fsm-render-types";
import {
  guessStateNodeDimensions,
  guessTransitionNodeDimensions,
  nodeIdForState,
  nodeIdForTransition,
  transitionId,
} from "./fsm-render-util";

const LAYOUT_OPTIONS: LayoutOptions = {
  "elk.algorithm": "layered",
  // "elk.hierarchyHandling": "INCLUDE_CHILDREN",
  "elk.layered.considerModelOrder": "NODES_AND_EDGES",
  "elk.layered.wrapping.strategy": "MULTI_EDGE",
  "elk.aspectRatio": "2",
  "elk.direction": "DOWN",
  // "elk.padding": `[top=${30}, left=30, right=30, bottom=30]`,
  // "spacing.nodeNode": `${machineNodeHeaderHeight + nodeVerticalSpacing}`,
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

    if (stateHasTransitions(stateDefinition)) {
      return stateTransitions(state.value, stateDefinition).map(
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
          },
          ...guessTransitionNodeDimensions(transition.name),
        })
      );
    }

    return [];
  };

const edgesForActiveStateTransitions = <Options extends FsmOptions>(
  instance: FsmRunningMachine<Options>
): ElkEdge[] => {
  const { machine, state } = instance;

  if (!state.value) return [];

  const stateDefinition = machine.states[state.value];
  if (stateHasTransitions(stateDefinition)) {
    return stateTransitions(state.value, stateDefinition).map((transition) => ({
      id: `e-${state.id}:${transition.name}`,
      sources: [nodeIdForState(state.id, transition.source)],
      targets: [nodeIdForTransition(state.id, transition)],
    }));
  }

  return [];
};

const nodesForActiveState = <Options extends FsmOptions>(
  instance: FsmRunningMachine<Options>
): ElkNodeWithMetadata[] => {
  const { machine, state } = instance;

  if (!state.value) return [];

  const stateDefinition = machine.states[state.value];

  return [
    {
      id: `${state.id}:${state.value}`,
      metadata: {
        type: "state",
        label: state.value,
        definition: stateDefinition,
      },
      children: [],
      ...guessStateNodeDimensions(state.value /*, stateDefinition*/),
    },
  ];
};

const nodesForRunningMachine =
  (send?: SendCommandFunc) =>
  <Options extends FsmOptions>(
    instance: FsmRunningMachine<Options>
  ): ElkNodeWithMetadata[] => {
    return [
      {
        id: instance.state.id,
        metadata: {
          type: "machine",
          label: instance.machine.id,
          instance: instance as unknown as AnyRunningMachine,
        },
        children: [
          ...nodesForActiveState(instance),
          ...nodesForActiveStateTransitions(send)(instance),
        ],
        edges: edgesForActiveStateTransitions(instance),
      },
    ];
  };

const edgesForRunningMachine = <Options extends FsmOptions>(
  instance: FsmRunningMachine<Options>
): ElkEdge[] => {
  const { machine, state } = instance;

  if (!state.value) return [];

  const id = state.value;

  const stateDefinition = machine.states[id];

  if (!stateHasTransitions(stateDefinition)) return [];

  return [
    ...stateTransitions(id, stateDefinition).flatMap((transition) => [
      {
        id: transitionId(state.id, transition, "in"),
        sources: [nodeIdForState(state.id, transition.source)],
        targets: [nodeIdForTransition(state.id, transition)],
      },
      //   {
      //     id: `${nodeIdForTransition(machine.id, transition)}-out`,
      //     sources: [nodeIdForTransition(machine.id, transition)],
      //     targets: [`${machine.id}-${transition.target}`],
      //   },
    ]),
  ];
};

const edgeToRunningMachineFromParent = <Options extends FsmOptions>(
  instance: FsmRunningMachine<Options>
): ElkEdge[] => {
  if (instance.state.parent) {
    return [
      {
        id: `e-${instance.state.parent}-${instance.state.id}`,
        sources: [instance.state.parent],
        targets: [instance.state.id],
      } as ElkEdge,
    ];
  }

  return [];
};

const edgeToEffectFromParent = (effect: FsmEffect): ElkEdge[] => {
  return [
    {
      id: `e-${effect.id}`,
      sources: [effect.parent],
      targets: [effect.id],
    } as ElkEdge,
  ];
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
          edgeToRunningMachineFromParent
        ),
        ...system.effects.flatMap(edgeToEffectFromParent),
        ...Array.from(system.instances.values()).flatMap(
          edgesForRunningMachine
        ),
      ],
    };

    return graph;
  };
