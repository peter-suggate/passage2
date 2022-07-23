import { DeepReadonly } from "./fsm-core-types";
import { FsmRunningMachine, FsmServiceId, FsmState } from "./fsm-system-types";
import { FsmMachine, FsmOptions } from "./fsm-types";

export const runMachine = <Options extends FsmOptions>(
  machine: FsmMachine<Options>,
  parent?: FsmServiceId | null
): FsmRunningMachine<Options> => {
  return {
    machine,
    state: {
      // value: null,
      value: null as any,
      context: machine.context,
      id: `running-${machine.id}`,
      children: new Map(),
      parent: parent || null,
    },
  };
};
