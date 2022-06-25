import { applyEffects } from "./applyEffects";
import { applyTransition } from "./applyTransition";
import {
  ActionDefinitions,
  FsmMachine,
  FsmService,
  ServiceDefinitions,
  SpawnedService,
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
): FsmService<States, InitialState, Services, Actions, Context> => {
  const transition = applyTransition(machine);
  const effects = applyEffects(machine);

  const initialTransition = transition();
  const initialState = {
    value: initialTransition.value,
    context: machine.context,
    spawnedServices: [] as SpawnedService[],
  };

  type Subscription = () => void;
  let subscribers: Subscription[] = [];

  const self = {
    currentState: initialState,
    subscribe: (subscription: Subscription) => {
      subscribers = subscribers
        .filter((cur) => cur !== subscription)
        .concat(subscription);

      return () => subscribers.filter((cur) => cur !== subscription);
    },
    updateState: (newState: typeof initialState) => {
      self.currentState = newState;

      subscribers.forEach((sub) => sub());
    },
    start: () => {
      const result = effects(
        initialTransition,
        self.currentState.context,
        { type: "initial" },
        self.send
      );

      self.updateState({ ...result });

      return result.spawnedServices;
    },
    transition: (transitionName: string) => {
      const newState = transition(self.currentState.value, transitionName);

      const result = effects(
        newState,
        self.currentState.context,
        { type: transitionName },
        self.send
      );

      self.updateState({ ...result, value: newState.value });

      return result.spawnedServices;
    },
    send: async (event: TransitionEvent<States, Actions>) => {
      self.transition(event.type);
    },
  };

  return self;
};
