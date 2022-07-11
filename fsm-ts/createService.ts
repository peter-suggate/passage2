import {
  AnyServiceEvent,
  FsmListener,
  FsmService,
  FsmServiceEvent,
  FsmServiceOptions,
  PendingService,
  SpawnedService,
} from "./fsm-service-types";
import { FsmMachine, FsmOptions, TransitionEvent } from "./fsm-types";
import { processServiceEvent } from "./processServiceEvent";

export const createService = <Options extends FsmOptions>(
  machine: FsmMachine<Options>,
  optionsIn?: Partial<FsmServiceOptions<Options>>
): FsmService<Options> => {
  const initialState = {
    value: machine.initial,
    context: machine.context,
    spawnedServices: {} as { [key: string]: SpawnedService },
  };

  type ServiceEvent = FsmServiceEvent<Options>;

  type DisposeSub = () => void;
  let listeners: FsmListener[] = [];
  const notifyListeners = (event: ServiceEvent) => {
    listeners.forEach((listener) => listener(event));
  };

  const options: FsmServiceOptions<Options> = {
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
    send: async (event: TransitionEvent<Options>) => {
      return self.transition(event.type, event.value);
    },
    resubscribeToSpawnedServices: () => {
      spawnedServiceListeners.forEach((disposer) => disposer());

      Object.values(self.currentState.spawnedServices)
        .filter(
          (service) =>
            // service.status === "pending" &&
            !!(service as PendingService).service
        )
        .forEach((service) => {
          console.warn("subscribed to service");
          spawnedServiceListeners.push(
            (service as PendingService).service!.subscribe((event) => {
              console.warn("received event", event);
              // We're notifying our listeners re a child service event.
              notifyListeners(event as any);
            })
          );
        });
    },
  };

  return self;
};
