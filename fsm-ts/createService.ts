import { applyEffects } from "./applyEffects";
import { applyTransition } from "./applyTransition";
import {
  ActionDefinitions,
  FsmMachine,
  ServiceDefinitions,
  StateDefinitions,
  TransitionEvent,
} from "./fsm-types";

export const createService = <
  States extends StateDefinitions<States, Services, Actions, Context>,
  InitialState extends keyof States,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<States, Actions, Context>,
  Context extends {}
>(
  machine: FsmMachine<States, InitialState, Services, Actions, Context>
) => {
  const transition = applyTransition(machine);
  const effects = applyEffects(machine);

  const initialState = transition();

  const self = {
    currentState: {
      value: initialState.value,
      context: machine.context,
    },
    updateState: (newState: { value: keyof States; context: Context }) => {
      self.currentState = newState;
    },
    start: async () => {
      const result = effects(
        initialState,
        self.currentState.context,
        { type: "initial" },
        self.send
      );

      self.updateState({ value: initialState.value, context: result.context });

      return await Promise.all(result.spawnedServices);
    },
    transition: async (transitionName: string) => {
      const newState = transition(self.currentState.value, transitionName);

      const result = effects(
        newState,
        self.currentState.context,
        { type: transitionName },
        self.send
      );

      self.updateState({ value: newState.value, context: result.context });

      return Promise.all(result.spawnedServices);
    },
    send: async (event: TransitionEvent<States, Actions>) => {
      self.transition(event.type);
    },
  };

  return self;
};
