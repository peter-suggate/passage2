import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { SpawnedService } from "../fsm-ts/fsm-types";
import styles from "./Nodes.module.css";

type Props = {
  data: { value: SpawnedService };
};

const serviceToViewModel = (service: SpawnedService) => {
  return { ...service };
};

export const PromiseNode = ({ data }: Props) => {
  const [vm, setVM] = React.useState(serviceToViewModel(data.value));

  React.useEffect(() => {
    const promiseAwaiter = async () => {
      await data.value.promise;
    };

    promiseAwaiter().then(() => {
      setVM(serviceToViewModel(data.value));
    });
  }, [data.value]);

  //   const onChange = React.useCallback(
  //     (evt: React.ChangeEvent<HTMLInputElement>) => {
  //       console.log(evt.target.value);
  //     },
  //     []
  //   );

  return (
    <div className={styles.promiseNode}>
      {/* <Handle type="target" position={Position.Top} /> */}
      <div>{data.value.status}</div>
      {/* <div>
        <label htmlFor="text">Text:</label>
        <input id="text" name="text" onChange={onChange} />
      </div> */}
      <Handle
        type="target"
        position={Position.Left}
        id="a"
        // style={handleStyle}
      />
      {/* <Handle type="source" position={Position.Bottom} id="b" /> */}
    </div>
  );
};
