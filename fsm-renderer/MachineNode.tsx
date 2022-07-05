import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { AnyService } from "../fsm-ts/fsm-types";
import { MachineContext } from "./MachineContext";
import styles from "./Nodes.module.css";

type Props = {
  data: {
    value: string;
    isActive: boolean;
    hasChildren: boolean;
    width: number;
    height: number;
    service: AnyService;
  };
};

// const toViewModel = (model: Props["data"]) => {
//   return { ...model };
// };

export const MachineNode = ({ data }: Props) => {
  // const [vm, setVM] = React.useState(toViewModel(data));

  const { width, height, service } = data;

  // React.useEffect(() => {
  //   const disposer = service.subscribe(() => {
  //     setVM(toViewModel(data));
  //   });

  //   disposer();
  // }, [data, data.value, service]);

  // console.log(service.currentState.context);

  return (
    <div
      className={`${styles.machineNode} ${
        data.isActive ? styles.isActive : ""
      } ${data.hasChildren ? styles.hasChildren : ""}`}
      style={{ width, height: height }}
    >
      <div className={styles.title}>{data.value}</div>
      {/* <Handle type="target" position={Position.Left} id="child" />
      <Handle type="source" position={Position.Right} id="parent" /> */}
      <Handle type="source" position={Position.Bottom} id="source" />
      <Handle type="target" position={Position.Top} id="target" />
      <MachineContext context={service.currentState.context} />
    </div>
  );
};
