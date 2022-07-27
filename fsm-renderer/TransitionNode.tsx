import React from "react";
import { Handle, Position } from "react-flow-renderer";
import {
  ElkNodeTransitionMetadata,
  GraphChangeDescription,
} from "./fsm-render-types";
import styles from "./Nodes.module.css";
import { IconButton } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

type Props = {
  data: {
    value: string;
    metadata: ElkNodeTransitionMetadata;
    onClick?: () => void;
    inStateId: string;
    outStateId: string;
    changeType: GraphChangeDescription["changeType"];
    width: number;
    height: number;
  };
};

export const TransitionNode = ({ data }: Props) => {
  const { width, height, metadata } = data;

  const isAutomatic = data.value === "onDone" || data.value === "onError";

  return (
    <div style={{ width, height }}>
      {isAutomatic ? (
        <div
          className={`${styles.transitionNode} ${styles.invoke} ${
            styles[data.changeType]
          } flex flex-row align-center`}
        >
          <div className="flex-grow" />
          <>
            {data.value === "onDone" ? (
              <CheckCircleOutlineIcon htmlColor="#080" fontSize="small" />
            ) : (
              <ErrorOutlineIcon htmlColor="#a00" fontSize="small" />
            )}
            <ArrowRightAltIcon />
            <span className={styles.target}>{metadata.target}</span>
          </>
          <Handle
            type="target"
            position={Position.Right}
            id={data.outStateId}
          />
        </div>
      ) : (
        <div
          className={`${styles.transitionNode} ${
            styles[data.changeType]
          } flex flex-row align-center`}
        >
          <div className={"flex-grow"} />
          <div className={`flex flex-col items-end ${styles.text}`}>
            {/* <div className={styles.label}>Transition</div> */}
            {/* {isAutomatic ? null : (
            <div className={styles.title}>{data.value}</div>
          )} */}
            <div className={styles.title}>{data.value}</div>
          </div>
          <div className={"flex-grow"} />
          {data.onClick ? (
            <IconButton onClick={data.onClick}>
              <NavigateNextIcon />
            </IconButton>
          ) : null}
        </div>
      )}
    </div>
  );
};
