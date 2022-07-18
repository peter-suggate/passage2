import { FsmRunningMachine, FsmServiceId, FsmState } from "./fsm-service-types";
import { FsmMachine, FsmOptions } from "./fsm-types";

export const runMachine = <Options extends FsmOptions>(
  machine: FsmMachine<Options>,
  parent: FsmServiceId | undefined
): FsmRunningMachine<Options> => {
  return {
    machine,
    state: {
      // value: null,
      context: machine.context,
      id: `running-${machine.id}`,
      children: new Map(),
      parent,
    } as FsmState<Options>,
  };
};
