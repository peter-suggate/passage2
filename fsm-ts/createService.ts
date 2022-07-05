import { applyEffects } from "./applyEffects";
import { applyTransition } from "./applyTransition";
import { KeyOf } from "./fsm-core-types";
import {
  ActionDefinitions,
  FsmListener,
  FsmMachine,
  FsmService,
  FsmServiceEvent,
  ServiceDefinitions,
  SpawnedService,
  StateDefinitions,
  TransitionEvent,
} from "./fsm-types";

export const createService = <
  States extends StateDefinitions<States, Services, Actions, Context>,
  InitialState extends KeyOf<States>,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends object
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

  type DisposeSub = () => void;
  let listeners: FsmListener[] = [];
  const notifySubscribers = (event: FsmServiceEvent) => {
    listeners.forEach((listener) => listener(event));
  };

  // Maintain listeners to any long-lived children so we can pass on their
  // events to our own listeners.
  const spawnedServiceListeners: DisposeSub[] = [];

  const self = {
    currentState: initialState,
    machine,
    subscribe: (subscription: FsmListener) => {
      listeners = listeners
        .filter((cur) => cur !== subscription)
        .concat(subscription);

      return () => {
        listeners = listeners.filter((cur) => cur !== subscription);
      };
    },
    updateState: (newState: typeof initialState) => {
      const prevState = self.currentState;

      spawnedServiceListeners.forEach((disposer) => disposer());

      self.currentState = newState;

      newState.spawnedServices
        .filter(({ service }) => !!service)
        .forEach(({ service }) => {
          spawnedServiceListeners.push(
            service!.subscribe((event) => {
              notifySubscribers(event);
            })
          );
        });

      listeners.forEach((sub) =>
        sub({ type: "state updated", prevState, newState })
      );
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
    transition: (transitionName: string, value: any) => {
      const newState = transition(self.currentState.value, transitionName);

      const result = effects(
        newState,
        self.currentState.context,
        { type: transitionName, value },
        self.send
      );

      // result.spawnedServices.forEach(service => service.service)
      if (result.value !== newState.value)
        throw Error("result.value !== newState.value");

      self.updateState({ ...result, value: newState.value });

      return result.spawnedServices;
    },
    send: async (event: TransitionEvent<States, Actions>) => {
      return self.transition(event.type, event.value);
    },
  };

  return self;
};
