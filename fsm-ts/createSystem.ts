import { DeepReadonly } from "./fsm-core-types";
import { assert } from "./fsm-core-util";
import {
  FsmInterpreter,
  FsmServiceId,
  FsmRunningMachines,
  FsmState,
  FsmInterpreterEvent,
  FsmListener,
  FsmRunningMachine as FsmInstantiatedMachine,
  FsmInterpreterCommand,
  FsmEffect,
} from "./fsm-service-types";
import { AnyOptions, FsmMachine, FsmOptions } from "./fsm-types";
import { processCommand } from "./processCommand";
import { runMachine } from "./runMachine";

type SystemData = {
  instances: FsmRunningMachines;
  commands: FsmInterpreterCommand<AnyOptions>[];
  effects: FsmEffect[];
};

type SystemDataRO = DeepReadonly<SystemData>;

export const emptySystem = (): SystemDataRO => ({
  instances: new Map(),
  commands: [],
  effects: [],
});

export const instantiateMachine =
  <Options extends FsmOptions>(machine: FsmMachine<Options>) =>
  (existing: SystemDataRO): SystemDataRO => ({
    ...existing,
    commands: [
      ...existing.commands,
      { type: "instantiate", machine, parent: undefined },
    ],
  });

export const send =
  <Options extends FsmOptions>(
    commandOrCommands:
      | FsmInterpreterCommand<Options>
      | FsmInterpreterCommand<Options>[]
  ) =>
  (existing: SystemDataRO): SystemDataRO => {
    const commands = Array.isArray(commandOrCommands)
      ? commandOrCommands
      : [commandOrCommands];
    return {
      ...existing,
      commands: [...existing.commands, ...commands],
    };
  };

type Debuggable = {
  debug(): void;
};

const notifyListeners = (
  listeners: DeepReadonly<FsmListener[]>,
  event: DeepReadonly<
    FsmInterpreterEvent<AnyOptions> | FsmInterpreterCommand<AnyOptions>
  >
) => {
  listeners.forEach((listener) => listener(event));
};

const processNextCommand = (
  data: SystemDataRO,
  listeners?: FsmListener[]
): SystemDataRO => {
  assert(data.commands.length);

  const next = data.commands[0];
  console.log(next);
  const { updatedInstances, newCommands, newEffects } = processCommand(
    next as FsmInterpreterCommand<AnyOptions>,
    data.instances
  );

  listeners && notifyListeners(listeners, next);

  return {
    commands: [...newCommands, ...data.commands.slice(1)],
    effects: [...newEffects, ...data.effects],
    instances: updatedInstances,
  };
};

export const processCommands = (existing: SystemDataRO) => {
  let result = existing;

  while (result.commands.length) {
    result = processNextCommand(result);
  }

  return result;
};

type Common = Debuggable;

type RunFuncResult<Options extends FsmOptions> = CanRunMachine &
  AccessLatestMachine<Options> &
  // StartLatestRunningMachine &
  CanAccessRunningMachines &
  Common;

type CanRunMachine = {
  instantiate: <Options extends FsmOptions>(
    machine: FsmMachine<Options>
  ) => RunFuncResult<Options>;
};

type NonEmptySystem = CanRunMachine & CanAccessRunningMachines & Common;

type SystemWithStartedMachine = NonEmptySystem & CanTransitionRunningMachine;

type AccessLatestMachine<Options extends FsmOptions> = {
  latest: FsmInstantiatedMachine<Options>;
};
type StartLatestRunningMachine = {
  start: () => SystemWithStartedMachine;
};
type CanTransitionRunningMachine = {
  transition: (
    id: FsmServiceId,
    name: string,
    value: any
  ) => SystemWithStartedMachine;
};

type CanAccessRunningMachines = Pick<FsmInterpreter, "get">;

// const transitionImpl = (
//   data: DeepReadonly<SystemData>,
//   id: FsmServiceId,
//   name: string | null,
//   value: any
// ): SystemWithStartedMachine => {
//   const running = data.runningMachines.get(id)!;

//   assert(running.state.id);

//   const newData: DeepReadonly<SystemData> = {
//     ...data,
//     unprocessedEvents: [
//       ...data.unprocessedEvents,
//       {
//         type: "transition",
//         id: running.state.id,
//         name,
//         value,
//       },
//     ],
//   };

//   return {
//     get: (id) => getImpl(newData, id),
//     run: (machine) => runImpl(newData, machine),
//     transition: (id, name, value) => transitionImpl(newData, id, name, value),
//     debug: () => debugImpl(newData),
//   };
// };

// const getImpl = (data: DeepReadonly<SystemData>, id: FsmServiceId) => {
//   if (!data.instances.has(id))
//     console.warn(
//       `System doesn't contain any running machine with id: ${id}. Running machines are: [${Array.from(
//         data.instances.keys()
//       ).join(", ")}]`
//     );

//   return data.instances.get(id);
// };

// const updateMachineStateImpl = <Options extends FsmOptions>(
//   data: DeepReadonly<SystemData>,
//   id: FsmServiceId,
//   updates: Partial<FsmState<Options>>
// ): DeepReadonly<SystemData> => {
//   const running = getImpl(data, id);

//   if (!running)
//     throw Error(
//       "Updating a running machine's state failed. No running machine with id: " +
//         id +
//         " was found."
//     );

//   const newData: DeepReadonly<SystemData> = {
//     ...data,
//     instances: new Map(data.instances).set(id, {
//       machine: running.machine,
//       state: { ...running.state, ...updates },
//     }),
//   };

//   return newData;
// };

// const instantiateImpl = <Options extends FsmOptions>(
//   data: DeepReadonly<SystemData>,
//   machine: FsmMachine<Options>
// ): RunFuncResult<Options> => {
//   const instantiated = runMachine(machine, undefined);

//   const newData: DeepReadonly<SystemData> = {
//     ...data,
//     instances: new Map(data.instances).set(
//       instantiated.state.id,
//       instantiated as unknown as FsmInstantiatedMachine<AnyOptions>
//     ),
//   };

//   return {
//     instantiate: <O extends FsmOptions = Options>(machine: FsmMachine<O>) => {
//       return instantiateImpl<O>(newData, machine);
//     },
//     get: (id: FsmServiceId) => {
//       return newData.instances.get(id);
//     },
//     debug: () => debugImpl(newData),
//     latest: instantiated as unknown as FsmInstantiatedMachine<Options>,
//   };
// };

// type EmptySystem = CanRunMachine & Common;

// const debugImpl = (data: DeepReadonly<SystemData>) => {
//   console.log(
//     `Running machines: ${Array.from(data.instances.entries()).map(
//       (e) => `${e[0]}: ${JSON.stringify(e[1], undefined, 2)}`
//     )}`
//   );
// };

// export const createSystem = (): EmptySystem => {
//   const data: SystemData = {
//     instances: new Map(),
//     commands: [],
//     effects: [],
//   };

//   return {
//     instantiate: (machine) => instantiateImpl(data, machine),
//     debug: () => debugImpl(data),
//   };
// };

// type Subscribable = { subscribe: (listener: FsmListener) => () => void };
// type ReceivesEvents = {
//   send: (event: FsmInterpreterEvent<AnyOptions>) => void;
// };
// type Tickable = { tick: () => void };
// type Store = Subscribable & ReceivesEvents & Tickable & Debuggable;

// export const createStore = (system: DeepReadonly<SystemData>): Store => {
//   let listeners: FsmListener[] = [];
//   let unprocessedCommands: FsmInterpreterCommand<AnyOptions>[] = [];
//   let data: DeepReadonly<SystemData> = system;

//   const subscribeImpl = (subscription: FsmListener) => {
//     listeners = listeners
//       .filter((cur) => cur !== subscription)
//       .concat(subscription);

//     return () => {
//       listeners = listeners.filter((cur) => cur !== subscription);
//     };
//   };

//   const sendImpl = (event: FsmInterpreterCommand<AnyOptions>) => {
//     unprocessedCommands.push(event);
//     // const newData: DeepReadonly<SystemData> = {
//     //   ...data,
//     //   unprocessedEvents: [...data.unprocessedEvents, event],
//     // };

//     // data = newData;
//   };

//   const tickImpl = () => {
//     let newData: DeepReadonly<SystemData> = { ...data };

//     while (unprocessedCommands.length) {
//       newData = processNextCommand(newData);
//       console.warn(
//         "newData.unprocessedEvents.length",
//         unprocessedCommands.length
//       );
//     }

//     // return {
//     //   get: (id) => getImpl(newData, id),
//     //   run: <Options extends FsmOptions>(machine: FsmMachine<Options>) =>
//     //     runImpl<Options>(newData, machine),
//     //   transition: (id: FsmServiceId, name: string, value: any) =>
//     //     transitionImpl(newData, id, name, value),
//     //   tick: () => tickImpl(newData),
//     //   subscribe: (sub) => subscribeImpl(newData as SystemData, sub),
//     //   debug: () => debugImpl(newData),
//     // };
//   };

//   const debugImpl = () => {
//     return `Unprocessed events: [${unprocessedCommands
//       .map((e) => JSON.stringify(e, undefined, 2))
//       .join(", ")}]\n`;
//   };

//   return {
//     subscribe: subscribeImpl,
//     send: sendImpl,
//     tick: tickImpl,
//     debug: debugImpl,
//   };
// };
