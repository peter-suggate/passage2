import { pipe } from "fp-ts/lib/function";
import { getAnyFinalStateDataValue } from "./applyEffects";
import { applyTransition } from "./applyTransition";
import { DeepReadonly, KeyOf } from "./fsm-core-types";
import type {
  FsmEffect,
  FsmCommand,
  FsmRunningMachine,
  FsmServiceId,
  FsmState,
  FsmRep,
  SettledEffect,
} from "./fsm-system-types";
import { machineFinalState } from "./fsm-transforms";
import { AnyOptions, FsmEvent, FsmOptions } from "./fsm-types";
import { invokeService } from "./invokeService";
import { runMachine } from "./runMachine";

const executeAction =
  <Options extends FsmOptions>(
    actionDefinitions: Options["Actions"],
    context: Options["Context"],
    event: FsmEvent
  ) =>
  (action: KeyOf<Options["Actions"]>) => {
    const newContext = actionDefinitions[action](context, event);

    return { ...context, ...newContext };
  };

export const processNextCommand = <Options extends FsmOptions>(
  rep: FsmRep
): FsmRep => {
  const command: FsmCommand<AnyOptions> = rep[1][0];
  const poppedCommand = (rep: FsmRep): FsmRep => [rep[0], rep[1].slice(1)];

  const removedEffect =
    (effectId: string) =>
    (rep: FsmRep): FsmRep =>
      [
        {
          ...rep[0],
          effects: rep[0].effects.filter((cur) => cur.id !== effectId),
        },
        rep[1],
      ];

  const settledEffect =
    (
      effectId: string,
      result: "success" | "error",
      commands: FsmCommand<AnyOptions>[]
    ) =>
    (rep: FsmRep): FsmRep =>
      [
        {
          ...rep[0],
          effects: rep[0].effects.map((cur) =>
            cur.id === effectId
              ? {
                  ...cur,
                  status: "settled",
                  result,
                  commands: commands,
                }
              : cur
          ),
        },
        rep[1],
      ];

  const modifiedInstance =
    (
      instance: FsmRunningMachine<AnyOptions>,
      newCommands: FsmCommand<AnyOptions>[] = []
    ) =>
    (rep: FsmRep): FsmRep =>
      [
        {
          ...rep[0],
          instances: new Map(rep[0].instances).set(
            instance.state.id,
            instance as unknown as FsmRunningMachine<AnyOptions>
          ),
        },
        [...newCommands, ...rep[1]],
      ];

  const addedCommands =
    (newCommands: FsmCommand<Options>[]) =>
    (rep: FsmRep): FsmRep =>
      [rep[0], [...(newCommands as FsmCommand<AnyOptions>[]), ...rep[1]]];

  const pushedEffect =
    (newEffect: FsmEffect) =>
    (rep: FsmRep): FsmRep =>
      [
        {
          instances: rep[0].instances,
          effects: [...rep[0].effects, newEffect],
        },
        rep[1],
      ];

  if (command.type === "instantiate") {
    const instantiated = runMachine(command.machine, command.parent);

    return pipe(rep, poppedCommand, (rep) => [
      {
        ...rep[0],
        instances: new Map(rep[0].instances).set(
          instantiated.state.id,
          instantiated as unknown as FsmRunningMachine<AnyOptions>
        ),
      },
      [
        { type: "transition", id: instantiated.state.id, name: null },
        ...rep[1],
      ],
    ]);
  }

  if (command.type === "settle effect") {
    return pipe(
      rep,
      poppedCommand,
      settledEffect(
        command.effectId,
        command.result,
        command.commands as FsmCommand<AnyOptions>[]
      ),
      addedCommands([
        ...(command.commands as FsmCommand<Options>[]),
        { type: "remove effect", effectId: command.effectId },
      ])
    );
  }

  if (command.type === "remove effect") {
    return pipe(rep, poppedCommand, removedEffect(command.effectId));
  }

  const { instances } = rep[0];

  const instance = instances.get(
    command.id
  ) as unknown as FsmRunningMachine<Options>;
  const { state, machine } = instance;
  const { id } = state;

  const updatedMachineState =
    (id: FsmServiceId, newState: Partial<FsmState<AnyOptions>>) =>
    (rep: FsmRep): FsmRep => {
      const existing = rep[0].instances.get(id)!;

      return modifiedInstance({
        ...existing,
        state: {
          ...existing.state,
          ...newState,
        },
      })(rep);
    };

  switch (command.type) {
    case "transition": {
      const { name } = command;

      const transitionResult = applyTransition(machine)(state.value, name);

      const newCommands: FsmCommand<Options>[] = [];
      transitionResult.actions.length &&
        newCommands.push({
          id,
          type: "execute actions",
          actions: transitionResult.actions,
          event: command,
        });

      name !== null &&
        newCommands.push({
          id,
          type: "exit state",
          value: state.value,
        });

      newCommands.push({
        id,
        type: "enter",
        value: transitionResult.value,
      });

      newCommands.push(
        ...transitionResult.services.map(
          (invocation) =>
            ({
              type: "invoke",
              id,
              invocation,
            } as FsmCommand<Options>)
        )
      );

      // If a final transition
      const finalState = machineFinalState(machine);
      if (transitionResult.value === finalState && state.parent) {
        const child = instances.get(command.id)!;
        // let valueReturnedFromChild = getAnyFinalStateDataValue<Options>(
        //   child,
        //   finalState
        // );

        // console.warn("final transition reached");
        newCommands.push({
          type: "exit child",
          id: state.parent,
          child: command.id,
          // result: valueReturnedFromChild,
        });
      }

      return pipe(rep, poppedCommand, addedCommands(newCommands));
    }
    case "exit state": {
      return poppedCommand(rep);
    }
    case "enter": {
      return pipe(
        rep,
        poppedCommand,
        updatedMachineState(id, { ...state, value: command.value })
      );
    }
    case "execute actions": {
      const { actions } = command;

      let resultContext = { ...state.context };

      actions.forEach((action) => {
        const executer = executeAction(
          machine.actions,
          resultContext,
          command.event
        );

        const contextUpdates = executer(action);
        if (contextUpdates)
          resultContext = { ...resultContext, ...contextUpdates };
      });

      return pipe(
        rep,
        poppedCommand,
        updatedMachineState(id, { context: resultContext })
      );
    }
    case "invoke": {
      const { invocation } = command;

      const definition = machine.services[invocation.src];

      const [descriptor, newInstance, newServiceId, newEffect] =
        invokeService<Options>(state, definition, invocation, command);

      return pipe(
        rep,
        poppedCommand,
        updatedMachineState(id, {
          children: new Map(state.children).set(newServiceId, {
            ...descriptor,
          }),
        }),
        (rep) => {
          return newInstance ? modifiedInstance(newInstance)(rep) : rep;
        },
        (rep) =>
          newInstance
            ? addedCommands([
                {
                  type: "transition",
                  id: newInstance.state.id,
                  name: null,
                },
              ])(rep)
            : rep,
        (rep) => (newEffect ? pushedEffect(newEffect)(rep) : rep)
      );

      // newInstance && updatedInstances.set(newInstance.state.id, newInstance);

      // newInstance &&
      //   newCommands.push({
      //     type: "transition",
      //     id: newInstance.state.id,
      //     name: null,
      //   });

      // newEffect && newEffects.push(newEffect);

      // break;
    }
    case "exit child": {
      const parent = instances.get(command.id)!;
      const child = instances.get(command.child)!;

      if (child) {
        // If child is a machine
        const finalState = machineFinalState(child.machine);

        const valueReturnedFromChild = getAnyFinalStateDataValue<Options>(
          child,
          finalState!
        );

        return pipe(
          rep,
          poppedCommand,
          updatedMachineState(id, {
            children: new Map(state.children).set(command.child, {
              status: "settled",
              service: undefined,
            }),
          }),
          (rep) => {
            const instances = new Map(rep[0].instances);
            instances.delete(command.child);
            return [
              {
                ...rep[0],
                instances,
              },
              rep[1],
            ] as FsmRep;
            // return [rep[0], rep[1]] as FsmRep;
          },
          (rep) => {
            // TODO if the final state has a data() func we call it (passing in context and event?)
            // and pass resulting data as value to onSendEvent somehow..
            const parentInvokingState =
              parent.machine.states[parent.state.value];

            return parentInvokingState.invoke?.onDone
              ? addedCommands([
                  {
                    type: "transition",
                    id,
                    name: "onDone",
                    value: valueReturnedFromChild,
                  },
                ])(rep)
              : rep;
          }
        );
      }

      return poppedCommand(rep);
    }
  }

  throw Error("Unhandled case!");
  // return { updatedInstances, newCommands, newEffects };
};
