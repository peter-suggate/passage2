import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { AnyStateDefinition } from "../fsm-ts/fsm-types";
import styles from "./Nodes.module.css";

type Props = {
  data: {
    value: string;
    definition: AnyStateDefinition;
    isActive: boolean;
    width: number;
    height: number;
  };
};

// const toViewModel = (model: Props["data"]) => {
//   return { ...model };
// };

export const StateNode = ({ data }: Props) => {
  //   const [vm, setVM] = React.useState(toViewModel(data));
  const { width, height, definition } = data;

  return (
    <div
      className={`${styles.stateNode} ${data.isActive ? styles.isActive : ""}`}
      style={{ width, height: height }}
    >
      <div className={styles.title}>{data.value}</div>
      {definition.type === "final" ? (
        <span className={styles.finalLabel}>Final</span>
      ) : null}
      {/* <Handle type="target" position={Position.Left} id="child" />
      <Handle type="source" position={Position.Right} id="parent" /> */}
      <Handle type="source" position={Position.Bottom} id="source" />
      <Handle type="target" position={Position.Top} id="target" />
    </div>
  );
};
