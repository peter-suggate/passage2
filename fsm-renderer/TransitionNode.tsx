import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { GraphChangeDescription } from "./fsm-render-types";
import styles from "./Nodes.module.css";

type Props = {
  data: {
    value: string;
    onClick: () => void;
    inStateId: string;
    outStateId: string;
    removing: boolean;
    changeType: GraphChangeDescription["changeType"];
  };
};

// const toViewModel = (model: Props["data"]) => {
//   return { ...model };
// };

export const TransitionNode = ({ data }: Props) => {
  //   const [vm, setVM] = React.useState(toViewModel(data));
  // const [show, setShow] = React.useState(true);

  // const onClick = React.useCallback(() => {
  //   window.setTimeout(() => {
  //     data.onClick();
  //   }, 300);

  //   setShow(false);
  // }, [data]);
  // console.log("removing", data.removing);

  return (
    <div
    // className={}
    // in={!data.removing}
    // timeout={500}
    // classNames={"list-transition"}
    // appear
    // unmountOnExit
    >
      <div
        className={`${styles.transitionNode} ${styles[data.changeType]}`}
        onClick={data.onClick}
      >
        <div className={styles.title}>{data.value}</div>
        {/* <Handle type="source" position={Position.Right} id={data.inStateId} />
      <Handle type="target" position={Position.Left} id={data.outStateId} /> */}
        <Handle type="source" position={Position.Bottom} id={data.inStateId} />
        <Handle type="target" position={Position.Top} id={data.outStateId} />
      </div>
    </div>
  );
};
