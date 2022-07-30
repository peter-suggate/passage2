import { emptySystem, exhaust, tick } from "./fsmSystem";
import type {
  FsmCommand,
  FsmListener,
  FsmSystemData,
  PendingEffect,
  UnstartedEffect,
} from "./fsm-system-types";
import type { AnyOptions, FsmOptions } from "./fsm-types";
import type {
  FsmCommandQueueListener,
  FsmCommandStore,
  FsmStore,
} from "./fsm-store-types";
import { sleep } from "./fsm-core-util";

export const commandStore = (): FsmCommandStore => {
  let commands: FsmCommand<AnyOptions>[] = [];
  let listeners: FsmCommandQueueListener[] = [];

  const sendImpl = <Options extends FsmOptions>(
    commandOrCommands: FsmCommand<Options>
    // | FsmCommand<Options>[]
  ) => {
    const commandAny = commandOrCommands as FsmCommand<AnyOptions>;

    commands = commands.concat(commandAny);

    listeners.forEach((l) => l({ kind: "sent", command: commandAny }));
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
    if (commands.length) {
      const next = commands[0];

      commands = commands.slice(1);

      listeners.forEach((l) => l({ kind: "processed", command: next }));
    }
  };

  setInterval(tickImpl, 0);

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

    commandStore.subscribe((event) => {
      if (event.kind !== "processed") return;

      const [newData, newCommands] = tick(listeners)([data, [event.command]]);

      newCommands.forEach(commandStore.send);

      const withEffectsApplied: FsmSystemData = {
        ...newData,
        effects: newData.effects.map((effect) => {
          if (effect.status === "not started") {
            const promise = (effect as UnstartedEffect).execute((command) =>
              commandStore.send(command)
            );

            promise.then((commands) => {
              commands.map(commandStore.send);
            });

            return {
              ...effect,
              status: "pending",
              promise,
            };
          } else return effect;
        }),
      };

      data = withEffectsApplied;
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

    const waitForAllEffectsImpl = async () => {
      await Promise.all(
        data.effects
          .filter((effect) => effect.status === "pending")
          .map((effect) => (effect as PendingEffect).promise)
      );
    };

    return {
      data: dataImpl,
      subscribe: subscribeImpl,
      waitForAllEffects: waitForAllEffectsImpl,
      debug: debugImpl,
    };
  };
