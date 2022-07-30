import React from "react";
import { Handle, Position } from "react-flow-renderer";
import {
  machineStateDefinition,
  machineTransitions,
} from "../fsm-ts/fsm-transforms";
import { ElkNodeMetadata } from "./fsm-render-types";
import { MachineContext } from "./MachineContext";
import { commands } from "./model";
import styles from "./Nodes.module.css";
import { StateNode } from "./StateNode";
import { TransitionNode } from "./TransitionNode";

type Props = {
  data: {
    value: string;
    isActive: boolean;
    hasChildren: boolean;
    width: number;
    height: number;
    metadata: ElkNodeMetadata;
  };
};

export const MachineNode = ({ data }: Props) => {
  const { width, height, metadata } = data;

  if (metadata.type !== "machine") throw Error();

  // const { machine, state } = metadata.instance;

  return (
    <div
      className={`${styles.machineNode} ${
        data.isActive ? styles.isActive : ""
      } ${data.hasChildren ? styles.hasChildren : ""} flex flex-col`}
      style={{ width, height: height }}
    >
      <div className={`text-3xl font-bold ${styles.title}`}>{data.value}</div>
      {/* <StateNode
        data={{
          width: 220,
          height: 65,
          changeType: "no-change",
          metadata: {
            type: "state",
            value: state.value,
            label: state.value,
            definition: machineStateDefinition(machine, state.value),
          },
        }}
      />
      {machineTransitions(machine, { state: state.value }).map((transition) => (
        <TransitionNode
          key={transition.name}
          data={{
            changeType: "no-change",
            inStateId: transition.source,
            outStateId: transition.target,
            value: transition.name,
            onClick: () =>
              commands.send({
                type: "transition",
                id: state.id,
                name: transition.name,
              }),
          }}
        />
      ))} */}
      <Handle
        type="target"
        position={Position.Left}
        id="child"
        style={{ top: 32 + 6 }}
      />
      {/* <Handle type="source" position={Position.Right} id="parent" /> */}
      {/* <Handle type="source" position={Position.Bottom} id="source" />
      <Handle type="target" position={Position.Top} id="target" /> */}
      <div className="flex-grow" />
      <MachineContext
        context={metadata.type === "machine" && metadata.instance.state.context}
      />
    </div>
  );
};
