import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { ElkNodeStateInvokeMetadata } from "./fsm-render-types";
import styles from "./Nodes.module.css";

type Props = {
  data: { width: number; height: number; metadata: ElkNodeStateInvokeMetadata };
};

export const InvokeNode = ({ data }: Props) => {
  const { width, height, metadata } = data;

  const { label } = metadata;

  return (
    <div
      className={`${styles.invokeNode}  ${styles[data.metadata.changeType]}`}
      style={{ width, height }}
    >
      <div className={`${styles.invokeContent} truncate`}>
        <span className={styles.label}>Invoke</span>
        <span className={`${styles.src}`} title={label}>
          {label}
        </span>
        {/* <div className={styles.onDone}>
        <CheckCircleOutlineIcon htmlColor="#080" fontSize="small" />
        <ArrowRightAltIcon />
        <span className={styles.target}>{definition.invoke.onDone.target}</span>
      </div> */}
        {/* {definition.invoke.onError ? (
        <div className={styles.onError}>
          <ErrorOutlineIcon htmlColor="#a00" fontSize="small" />
          <ArrowRightAltIcon />
          <span className={styles.target}>
            {definition.invoke.onError.target}
          </span>
        </div>
      ) : null} */}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className={styles.sourceHandle}
        // id="a"
        // style={handleStyle}
      />
      {/* <Handle type="source" position={Position.Bottom} id="b" /> */}
    </div>
  );
};
