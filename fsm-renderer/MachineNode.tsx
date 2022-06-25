import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { createService } from "../fsm-ts/createService";
import { SpawnedService } from "../fsm-ts/fsm-types";
import styles from "./MachineNode.module.css";

// const handleStyle = { left: 10 };

type Props = {
  data: { value: SpawnedService };
};

const serviceToViewModel = (service: SpawnedService) => {
  return { ...service.service };
};

export const MachineNode = ({ data }: Props) => {
  const [vm, setVM] = React.useState(serviceToViewModel(data.value));

  React.useEffect(() => {
    const disposer = data.value.service!.subscribe(() => {
      setVM(serviceToViewModel(data.value));
    });

    disposer();
  }, [data.value]);

  const onChange = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      console.log(evt.target.value);
    },
    []
  );

  return (
    <div className={styles.machineNode}>
      {/* <Handle type="target" position={Position.Top} /> */}
      <div>{vm.currentState?.value as string}</div>
      {/* <div>
        <label htmlFor="text">Text:</label>
        <input id="text" name="text" onChange={onChange} />
      </div> */}
      <Handle
        type="source"
        position={Position.Right}
        id="a"
        // style={handleStyle}
      />
      {/* <Handle type="source" position={Position.Bottom} id="b" /> */}
    </div>
  );
};
