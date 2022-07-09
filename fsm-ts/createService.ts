import { KeyOf } from "./fsm-core-types";
import {
  AnyServiceEvent,
  FsmListener,
  FsmService,
  FsmServiceEvent,
  FsmServiceOptions,
  PendingService,
  SpawnedService,
} from "./fsm-service-types";
import {
  ActionDefinitions,
  FsmMachine,
  ServiceDefinitions,
  StateDefinitions,
  TransitionEvent,
} from "./fsm-types";
import { processServiceEvent } from "./processServiceEvent";

export const createService = <
  States extends StateDefinitions<States, Services, Actions, Context>,
  InitialState extends KeyOf<States>,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends object
>(
  machine: FsmMachine<States, InitialState, Services, Actions, Context>,
  optionsIn?: Partial<FsmServiceOptions>
): FsmService<States, InitialState, Services, Actions, Context> => {
  const initialState = {
    value: machine.initial,
    context: machine.context,
    spawnedServices: {} as { [key: string]: SpawnedService },
  };

  type ServiceEvent = FsmServiceEvent<States, Services, Actions, Context>;

  type DisposeSub = () => void;
  let listeners: FsmListener[] = [];
  const notifyListeners = (event: AnyServiceEvent) => {
    listeners.forEach((listener) => listener(event));
  };

  const options: FsmServiceOptions = {
    stepper: async () => {},

    ...optionsIn,
  };

  // Maintain listeners to any long-lived children so we can pass on their
  // events to our own listeners.
  const spawnedServiceListeners: DisposeSub[] = [];

  const pendingEvents: {
    event: ServiceEvent;
  }[] = [];

  const enqueueEvent = (event: ServiceEvent) => {
    pendingEvents.push({ event });
  };

  const performAnyWork = async () => {
    while (pendingEvents.length) {
      const first = pendingEvents[0];
      pendingEvents.splice(0, 1);
      // console.warn(
      //   "processing event",
      //   first.event.type,
      //   "remaining:",
      //   pendingEvents.length
      // );
      processServiceEvent(self, first.event, enqueueEvent);
      notifyListeners(first.event);
      await options.stepper(first.event);
    }

    const spawnedServices = Object.values(self.currentState.spawnedServices);
    for (const spawnedService of spawnedServices) {
      switch (spawnedService.status) {
        case "pending": {
          if (spawnedService.service) {
            await spawnedService.service.tick();
          }
        }
      }
    }

    setTimeout(performAnyWork);
  };

  setTimeout(performAnyWork);

  const self = {
    currentState: initialState,
    machine,
    options,
    subscribe: (subscription: FsmListener) => {
      listeners = listeners
        .filter((cur) => cur !== subscription)
        .concat(subscription);

      return () => {
        listeners = listeners.filter((cur) => cur !== subscription);
      };
    },
    tick: async () => {
      return performAnyWork();
    },
    start: () => {
      enqueueEvent({ type: "transition", name: null, value: machine.initial });
    },
    transition: (transitionName: string, value: any) => {
      enqueueEvent({ type: "transition", name: transitionName, value });
    },
    send: async (event: TransitionEvent<States, Actions>) => {
      return self.transition(event.type, event.value);
    },
    resubscribeToSpawnedServices: () => {
      spawnedServiceListeners.forEach((disposer) => disposer());

      Object.values(self.currentState.spawnedServices)
        .filter(
          (service) =>
            service.status === "pending" &&
            !!(service as PendingService).service
        )
        .forEach((service) => {
          spawnedServiceListeners.push(
            (service as PendingService).service!.subscribe((event) => {
              notifyListeners(event);
            })
          );
        });
    },
  };

  return self;
};
