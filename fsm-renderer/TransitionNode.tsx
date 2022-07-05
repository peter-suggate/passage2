import React from "react";
import { Handle, Position } from "react-flow-renderer";
import styles from "./Nodes.module.css";

type Props = {
  data: {
    value: string;
    onClick: () => void;
    inStateId: string;
    outStateId: string;
  };
};

// const toViewModel = (model: Props["data"]) => {
//   return { ...model };
// };

export const TransitionNode = ({ data }: Props) => {
  //   const [vm, setVM] = React.useState(toViewModel(data));

  return (
    <div className={styles.transitionNode} onClick={data.onClick}>
      <div className={styles.title}>{data.value}</div>
      {/* <Handle type="source" position={Position.Right} id={data.inStateId} />
      <Handle type="target" position={Position.Left} id={data.outStateId} /> */}
      <Handle type="source" position={Position.Bottom} id={data.inStateId} />
      <Handle type="target" position={Position.Top} id={data.outStateId} />
    </div>
  );
};
