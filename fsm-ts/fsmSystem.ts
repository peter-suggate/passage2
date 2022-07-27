import { DeepReadonly } from "./fsm-core-types";
import {
  FsmInterpreterEvent,
  FsmListener,
  FsmCommand,
  FsmRep,
  FsmEffect,
} from "./fsm-system-types";
import { FsmSystemData } from "./fsm-system-types";
import { AnyOptions, FsmOptions } from "./fsm-types";
import { processNextCommand } from "./processCommand";

export const emptySystem = (): FsmSystemData => ({
  instances: new Map(),
  effects: [],
});

export const command =
  <Options extends FsmOptions>(command: FsmCommand<Options>) =>
  (rep: FsmRep) => {
    return [rep[0], [...rep[1], command]] as FsmRep;
  };

export const commands =
  <Options extends FsmOptions>(commands: FsmCommand<Options>[]) =>
  (rep: FsmRep) =>
    [rep[0], [...rep[1], ...commands]] as FsmRep;

const notifyListeners = (
  listeners: DeepReadonly<FsmListener[]>,
  event: DeepReadonly<FsmInterpreterEvent<AnyOptions> | FsmCommand<AnyOptions>>,
  latest: FsmSystemData
) => {
  listeners.forEach((listener) => listener(event, latest));
};

export const exhaust =
  (listeners: FsmListener[] = []) =>
  (existing: FsmRep): FsmRep => {
    let result: FsmRep = { ...existing };

    while (result[1].length) {
      const command = result[1][0];

      result = processNextCommand(result);

      notifyListeners(listeners, command, result[0]);

      if (result[1][0] === command)
        throw Error("A command was not popped: " + JSON.stringify(command));
    }

    return result;
  };

export const tick =
  (listeners: FsmListener[] = []) =>
  (existing: FsmRep): FsmRep => {
    let result: FsmRep = { ...existing };

    if (result[1].length) {
      const command = result[1][0];

      result = processNextCommand(result);

      notifyListeners(listeners, command, result[0]);

      if (result[1][0] === command)
        throw Error("A command was not popped: " + JSON.stringify(command));
    }

    return result;
  };
