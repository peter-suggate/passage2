import { getAnyFinalStateDataValue } from "./applyEffects";
import { createService } from "./createService";
import type {
  AnyService,
  FsmService,
  FsmServiceEvent,
  FsmState,
  PendingService,
  SpawnedService,
} from "./fsm-service-types";
import {
  ActionDefinitions,
  FsmEvent,
  MachineServiceDefinition,
  PromiseServiceDefinition,
  ServiceDefinition,
  ServiceDefinitions,
  ServiceInvocation,
  StateDefinitions,
} from "./fsm-types";

const invokePromiseService = <
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends object
>(
  currentState: FsmState<States, Context>,
  id: string,
  definition: PromiseServiceDefinition<Context>,
  invocation: ServiceInvocation<States, Services, Actions, Context>,
  event: FsmEvent,
  enqueueEvent: (
    event: FsmServiceEvent<States, Services, Actions, Context>
  ) => void
) => ({
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

const invokeMachineService = <
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends object
>(
  service: AnyService,
  currentState: FsmState<States, Context>,
  id: string,
  machine: MachineServiceDefinition,
  invocation: ServiceInvocation<States, Services, Actions, Context>,
  event: FsmEvent,
  enqueueEvent: (
    event: FsmServiceEvent<States, Services, Actions, Context>
  ) => void
): SpawnedService => {
  const childService = createService(machine, service.options);

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

export const invokeService = <
  States extends StateDefinitions<States, Services, Actions, Context>,
  Services extends ServiceDefinitions<States, Services, Actions, Context>,
  Actions extends ActionDefinitions<Actions, Context>,
  Context extends object
>(
  service: AnyService,
  currentState: FsmState<States, Context>,
  id: string,
  definition: ServiceDefinition<Context>,
  invocation: ServiceInvocation<States, Services, Actions, Context>,
  event: FsmEvent,
  enqueueEvent: (
    event: FsmServiceEvent<States, Services, Actions, Context>
  ) => void
) => {
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
      currentState,
      id,
      definition,
      invocation,
      event,
      enqueueEvent
    );
  }
};
