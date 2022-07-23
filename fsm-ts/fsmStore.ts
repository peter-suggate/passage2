import { pipe } from "fp-ts/lib/function";
import { emptySystem, exhaust } from "./fsmSystem";
import type {
  FsmCommand,
  FsmListener,
  FsmSystemData,
} from "./fsm-system-types";
import type { AnyOptions, FsmOptions } from "./fsm-types";
import type {
  FsmCommandQueueListener,
  FsmCommandStore,
  FsmStore,
} from "./fsm-store-types";
import { DeepReadonly } from "./fsm-core-types";

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

// type Common = Debuggable;

// type RunFuncResult<Options extends FsmOptions> = CanRunMachine &
//   AccessLatestMachine<Options> &
//   // StartLatestRunningMachine &
//   CanAccessRunningMachines &
//   Common;

// type CanRunMachine = {
//   instantiate: <Options extends FsmOptions>(
//     machine: FsmMachine<Options>
//   ) => RunFuncResult<Options>;
// };

// type NonEmptySystem = CanRunMachine & CanAccessRunningMachines & Common;

// type SystemWithStartedMachine = NonEmptySystem & CanTransitionRunningMachine;

// type AccessLatestMachine<Options extends FsmOptions> = {
//   latest: FsmInstantiatedMachine<Options>;
// };
// type StartLatestRunningMachine = {
//   start: () => SystemWithStartedMachine;
// };
// type CanTransitionRunningMachine = {
//   transition: (
//     id: FsmServiceId,
//     name: string,
//     value: any
//   ) => SystemWithStartedMachine;
// };

// type CanAccessRunningMachines = Pick<FsmInterpreter, "get">;

export const commandStore = (): FsmCommandStore => {
  let commands: FsmCommand<AnyOptions>[] = [];
  let listeners: FsmCommandQueueListener[] = [];

  const sendImpl = <Options extends FsmOptions>(
    commandOrCommands: FsmCommand<Options>
    // | FsmCommand<Options>[]
  ) => {
    commands.push(commandOrCommands);
  };

  const subscribeImpl = (subscription: typeof listeners[0]) => {
    listeners = listeners
      .filter((cur) => cur !== subscription)
      .concat(subscription);

    return () => {
      listeners = listeners.filter((cur) => cur !== subscription);
    };
  };

  const tickImpl = () => {
    console.warn("tick called. ", commands.length, listeners.length);
    // data = processCommands(listeners)(data, commands);
    if (commands.length) {
      const next = commands[0];

      commands = commands.slice(1);

      listeners.forEach((l) => l(next));
    }
    // while (commands.length) {
    //   // data = pipe(data, processCommands(listeners));
    //   const [processed, updatedData] = processNextCommand(data);

    //   data = updatedData;

    //   listeners.forEach((listener) => listener(processed, updatedData));
    // }
  };

  const exhaustImpl = () => {
    while (commands.length) {
      tickImpl();
    }
  };

  const dataImpl = () => {
    return commands;
  };

  const debugImpl = () => {
    return `Unprocessed commands: [${commands
      .map((e) => JSON.stringify(e, undefined, 2))
      .join(", ")}]\n`;
  };

  return {
    data: dataImpl,
    send: sendImpl,
    subscribe: subscribeImpl,
    tick: tickImpl,
    exhaust: exhaustImpl,
    debug: debugImpl,
  };
};

export const fsmStore =
  (commandStore: FsmCommandStore) =>
  (system: FsmSystemData = emptySystem()): FsmStore => {
    let listeners: FsmListener[] = [];
    let data: FsmSystemData = system;

    // const sendImpl = <Options extends FsmOptions>(
    //   commandOrCommands: FsmCommand<Options>
    //   | FsmCommand<Options>[]
    // ) => {
    //   commandStore.push(...commandOrCommands);
    //   // processCommands(listeners)(data, [commandOrCommands]);
    //   // data = pipe(data, send(commandOrCommands));
    // };
    commandStore.subscribe((command) => {
      const [newData, newCommands] = exhaust(listeners)([data, [command]]);

      newCommands.forEach(commandStore.send);

      data = newData;
    });

    const debugImpl = () => {
      return `Instances: [${Array.from(data.instances.entries())
        .map((e) => JSON.stringify(e, undefined, 2))
        .join(", ")}]\n`;
    };

    const dataImpl = () => {
      return data;
    };

    const subscribeImpl = (subscription: typeof listeners[0]) => {
      listeners = listeners
        .filter((cur) => cur !== subscription)
        .concat(subscription);

      return () => {
        listeners = listeners.filter((cur) => cur !== subscription);
      };
    };

    return {
      data: dataImpl,
      // update: ()
      subscribe: subscribeImpl,
      // send: sendImpl,
      debug: debugImpl,
    };
  };
