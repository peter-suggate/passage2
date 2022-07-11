import { getAnyFinalStateDataValue } from "./applyEffects";
import { createService } from "./createService";
import type {
  AnyService,
  FsmService,
  FsmServiceEvent,
  FsmServiceOptions,
  FsmState,
  PendingService,
  SpawnedService,
} from "./fsm-service-types";
import {
  ActionDefinitions,
  AnyOptions,
  FsmEvent,
  FsmOptions,
  MachineServiceDefinition,
  PromiseServiceDefinition,
  ServiceDefinition,
  ServiceInvocation,
} from "./fsm-types";

const invokePromiseService = <Options extends FsmOptions>(
  currentState: FsmState<Options>,
  id: string,
  definition: PromiseServiceDefinition<Options["Context"]>,
  invocation: ServiceInvocation<
    Options["States"],
    Options["Services"],
    Options["Actions"],
    Options["Context"]
  >,
  event: FsmEvent,
  enqueueEvent: (event: FsmServiceEvent<Options>) => void
): PendingService => ({
  status: "pending",
  service: undefined,
  promise: definition(currentState.context, event)
    .then((value) => {
      enqueueEvent({
        type: "service finished",
        id,
        result: value,
      });

      invocation.onDone &&
        enqueueEvent({
          type: "transition",
          name: "onDone",
          value,
        });
    })
    .catch((error) => {
      enqueueEvent({
        type: "service finished",
        id,
        result: error,
      });

      invocation.onError &&
        enqueueEvent({
          type: "transition",
          name: "onError",
          value: error,
        });
    }),
});

const invokeMachineService = <Options extends FsmOptions>(
  service: FsmService<Options>,
  id: string,
  machine: MachineServiceDefinition,
  invocation: ServiceInvocation<
    Options["States"],
    Options["Services"],
    Options["Actions"],
    Options["Context"]
  >,
  enqueueEvent: (event: FsmServiceEvent<Options>) => void
): PendingService => {
  const childService = createService<AnyOptions>(
    machine,
    // We're passing parent options down to child hence the cast
    service.options as unknown as FsmServiceOptions<AnyOptions>
  );

  return {
    status: "pending",
    service: childService,
    promise: new Promise((resolve, reject) => {
      // const machine = definition as AnyMachine;

      // const childService =
      // descriptor.service = childService;

      const disposer = childService.subscribe(() => {
        const finalState = Object.keys(machine.states).find(
          (state) => machine.states[state].type === "final"
        );

        if (!finalState) {
          throw new Error(
            "Machine has no final state and therefore cannot be exited."
          );
        }

        if (childService.currentState.value === finalState) {
          let valueReturnedFromChild = getAnyFinalStateDataValue(
            childService,
            finalState
          );

          enqueueEvent({
            type: "service finished",
            id,
            result: valueReturnedFromChild,
          });

          // TODO if the final state has a data() func we call it (passing in context and event?)
          // and pass resulting data as value to onSendEvent somehow..
          invocation.onDone &&
            enqueueEvent({
              type: "transition",
              name: "onDone",
              value: valueReturnedFromChild,
            });

          resolve(childService.currentState);

          disposer();
        }

        // TODO handle onError. How?
      });

      childService.start();
    }),
  };
};

export const invokeService = <Options extends FsmOptions>(
  service: FsmService<Options>,
  currentState: FsmState<Options>,
  id: string,
  definition: ServiceDefinition<Options["Context"]>,
  invocation: ServiceInvocation<
    Options["States"],
    Options["Services"],
    Options["Actions"],
    Options["Context"]
  >,
  event: FsmEvent,
  enqueueEvent: (event: FsmServiceEvent<Options>) => void
): PendingService => {
  if (typeof definition === "function") {
    return invokePromiseService(
      currentState,
      id,
      definition,
      invocation,
      event,
      enqueueEvent
    );
  } else {
    return invokeMachineService(
      service,
      id,
      definition,
      invocation,
      enqueueEvent
    );
  }
};
