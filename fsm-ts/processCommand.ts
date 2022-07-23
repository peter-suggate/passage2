import { getAnyFinalStateDataValue } from "./applyEffects";
import { applyTransition } from "./applyTransition";
import { DeepReadonly, KeyOf } from "./fsm-core-types";
import type {
  FsmEffect,
  FsmCommand,
  FsmRunningMachine,
  FsmRunningMachines,
  FsmServiceId,
  FsmState,
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

export const processCommand = <Options extends FsmOptions>(
  command: FsmCommand<Options>,
  instances: FsmRunningMachines
): {
  updatedInstances: FsmRunningMachines;
  newCommands: FsmCommand<Options>[];
  newEffects: FsmEffect[];
} => {
  const updatedInstances: FsmRunningMachines = new Map(instances);
  const newCommands: FsmCommand<Options>[] = [];
  const newEffects: FsmEffect[] = [];

  // assert(
  //   command.type,
  //   `One of ['type'] missing from event: ${JSON.stringify(
  //     command,
  //     undefined,
  //     2
  //   )}`
  // );

  if (command.type === "instantiate") {
    const instantiated = runMachine(command.machine, command.parent);

    updatedInstances.set(
      instantiated.state.id,
      instantiated as unknown as FsmRunningMachine<AnyOptions>
    );

    return {
      updatedInstances,
      newCommands: [
        { type: "transition", id: instantiated.state.id, name: null },
      ],
      newEffects,
    };
  }

  const service = instances.get(
    command.id
  ) as unknown as FsmRunningMachine<Options>;
  const { state, machine } = service;
  const { id } = state;

  const updateMachineStateImpl = (
    id: FsmServiceId,
    newState: Partial<FsmState<Options>>
  ) => {
    const existing = instances.get(id)!;

    updatedInstances.set(id, {
      ...existing,
      state: {
        ...existing.state,
        ...newState,
      },
    });
  };

  switch (command.type) {
    case "transition": {
      const { name } = command;

      const transitionResult = applyTransition(machine)(state.value, name);

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
        type: "enter state",
        value: transitionResult.value,
      });

      newCommands.push(
        ...transitionResult.services.map(
          (invocation) =>
            ({
              type: "invoke service",
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
          type: "exit child service",
          id: state.parent,
          child: command.id,
          // result: valueReturnedFromChild,
        });
      }

      break;
    }
    case "exit state": {
      break;
    }
    case "enter state": {
      updateMachineStateImpl(id, { ...state, value: command.value });
      break;
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

      updateMachineStateImpl(id, { context: resultContext });

      break;
    }
    case "invoke service": {
      const { invocation } = command;

      const definition = machine.services[invocation.src];

      const [descriptor, newInstance, newServiceId, newEffect] =
        invokeService<Options>(state, definition, invocation, command);

      updateMachineStateImpl(id, {
        children: new Map(state.children).set(newServiceId, { ...descriptor }),
      });

      newInstance && updatedInstances.set(newInstance.state.id, newInstance);

      newInstance &&
        newCommands.push({
          type: "transition",
          id: newInstance.state.id,
          name: null,
        });

      newEffect && newEffects.push(newEffect);

      break;
    }
    case "exit child service": {
      const parent = instances.get(command.id)!;
      const child = instances.get(command.child)!;

      if (child) {
        // If child is a machine
        const finalState = machineFinalState(child.machine);

        const valueReturnedFromChild = getAnyFinalStateDataValue<Options>(
          child,
          finalState!
        );

        updateMachineStateImpl(id, {
          children: new Map(state.children).set(command.child, {
            status: "settled",
            service: undefined,
          }),
        });

        // TODO if the final state has a data() func we call it (passing in context and event?)
        // and pass resulting data as value to onSendEvent somehow..
        const parentInvokingState = parent.machine.states[parent.state.value];

        parentInvokingState.invoke?.onDone &&
          newCommands.push({
            type: "transition",
            id,
            name: "onDone",
            value: valueReturnedFromChild,
          });
      }

      break;
    }
    default:
      throw Error("Unprocessed command: " + JSON.stringify(command));
  }

  return { updatedInstances, newCommands, newEffects };
};
