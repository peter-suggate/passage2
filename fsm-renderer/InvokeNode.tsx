import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { ElkNodePromiseMetadata } from "./fsm-render-types";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { DeepReadonly } from "../fsm-ts/fsm-core-types";
import { AnyStateDefinition } from "../fsm-ts/fsm-types";
import styles from "./Nodes.module.css";

type Props = {
  data: { width: number; height: number; metadata: { label: string } };
};

export const InvokeNode = ({ data }: Props) => {
  const { width, height, metadata } = data;

  const { label } = metadata;

  return (
    <div className={styles.invokeNode} style={{ width, height }}>
      <div className={styles.invokeContent}>
        <div className={styles.label}>Invoke</div>
        <div className={styles.src}>{label}</div>
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
