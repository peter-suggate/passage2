import { DeepReadonly } from "./fsm-core-types";
import {
  FsmInterpreterEvent,
  FsmListener,
  FsmCommand,
  FsmRep,
} from "./fsm-system-types";
import { FsmSystemData } from "./fsm-system-types";
import { AnyOptions, FsmOptions } from "./fsm-types";
import { processCommand } from "./processCommand";

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

// export const send =
//   <Options extends FsmOptions>(
//     commandOrCommands: FsmCommand<Options> | FsmCommand<Options>[]
//   ) =>
//   (existing: FsmCommand<Options>[]): FsmCommand<Options>[] => {
//     const commands = Array.isArray(commandOrCommands)
//       ? commandOrCommands
//       : [commandOrCommands];
//     return [...existing, ...commands];
//   };

const notifyListeners = (
  listeners: DeepReadonly<FsmListener[]>,
  event: DeepReadonly<FsmInterpreterEvent<AnyOptions> | FsmCommand<AnyOptions>>,
  latest: FsmSystemData
) => {
  listeners.forEach((listener) => listener(event, latest));
};

export const processNextCommand = (rep: FsmRep): FsmRep => {
  // assert(commands.length);

  // const next = commands[0];

  const { updatedInstances, newCommands, newEffects } = processCommand(
    rep[1][0],
    rep[0].instances
  );

  const resultData = {
    effects: [...newEffects, ...rep[0].effects],
    instances: updatedInstances,
  };

  const resultCommands = [...newCommands, ...rep[1].slice(1)];

  return [resultData, resultCommands];
};

// export const processCommands =
//   (listeners: FsmListener[] = []) =>
//   (existing: FsmRep): FsmRep => {
//     let result = existing[0];
//     const allNewCommands = [];

//     const commands = existing[1];

//     for (const command of commands) {
//       const [updated, newCommands] = processNextCommand(
//         result,
//         command
//       );

//       allNewCommands.push(...newCommands);

//       notifyListeners(listeners, command, updated);

//       result = updated;
//     }

//     return [result, allNewCommands];
//   };

export const exhaust =
  (listeners: FsmListener[] = []) =>
  (existing: FsmRep): FsmRep => {
    let result = { ...existing };

    while (result[1].length) {
      result = processNextCommand(result);
    }

    return result;
    // const allNewCommands = [];

    // const commands = existing[1];

    // for (const command of commands) {
    //   const [updated, newCommands] = processNextCommand<AnyOptions>(
    //     result,
    //     command
    //   );

    //   allNewCommands.push(...newCommands);

    //   notifyListeners(listeners, command, updated);

    //   result = updated;
    // }

    // return [result, allNewCommands];
  };
