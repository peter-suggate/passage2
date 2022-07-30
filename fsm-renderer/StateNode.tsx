import React from "react";
import { Handle, Position } from "react-flow-renderer";
import type {
  ElkNodeStateMetadata,
  GraphChangeDescription,
} from "./fsm-render-types";
import styles from "./Nodes.module.css";

type Props = {
  data: {
    // value: string;
    metadata: ElkNodeStateMetadata;
    // isActive: boolean;
    width: number;
    height: number;
  };
};

// const toViewModel = (model: Props["data"]) => {
//   return { ...model };
// };

export const StateNode = ({ data }: Props) => {
  //   const [vm, setVM] = React.useState(toViewModel(data));
  const { width, height, metadata } = data;
  const { definition } = metadata;

  if (metadata.type !== "state") throw Error();

  // const [parent] = useAutoAnimate<HTMLDivElement>(/* optional config */);
  const finalContent =
    definition?.type === "final" ? (
      <div className={styles.finalContent}>
        <div className={styles.label}>Final</div>
        {/* <span className={styles.actionLabel}>Action:</span> */}
        <span className={styles.action}>{definition?.data}</span>
      </div>
    ) : null;

  return (
    <div
      className={`${styles.stateNode} ${styles[data.metadata.changeType]}`}
      style={{ width, height }}
    >
      <div className={styles.content}>
        <div className={styles.label}>Active State</div>
        <div className={styles.title}>{data.metadata.value}</div>
        {finalContent}
        {/* <Handle type="target" position={Position.Left} id="child" />
        <Handle type="source" position={Position.Right} id="parent" /> */}
        {/* <Handle type="source" position={Position.Right} id="source" /> */}
        {/* <Handle type="target" position={Position.Left} id="target" /> */}
      </div>
    </div>
  );
};
