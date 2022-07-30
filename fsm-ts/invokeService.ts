import { DeepReadonly } from "./fsm-core-types";
import { generateId } from "./fsm-core-util";
import type {
  FsmRunningMachine,
  FsmState,
  PendingService,
  FsmCommand,
  FsmServiceId,
  FsmEffect,
  SendCommandFunc,
} from "./fsm-system-types";
import type {
  AnyOptions,
  FsmEvent,
  FsmOptions,
  MachineServiceDefinition,
  PromiseServiceDefinition,
  ServiceDefinition,
  ServiceInvocation,
} from "./fsm-types";
import { runMachine } from "./runMachine";

type ServiceInvocationFromOptions<Options extends FsmOptions> = DeepReadonly<
  ServiceInvocation<
    Options["States"],
    Options["Services"],
    Options["Actions"],
    Options["Context"]
  >
>;

const invokePromiseService = <Options extends FsmOptions>(
  currentState: FsmState<Options>,
  id: string,
  definition: PromiseServiceDefinition<Options["Context"]>,
  invocation: ServiceInvocationFromOptions<Options>,
  event: FsmEvent
): [
  PendingService,
  undefined | FsmRunningMachine<AnyOptions>,
  FsmServiceId,
  undefined | FsmEffect
] => {
  const effectId = `${currentState.id}:${invocation.src}`;

  const makePromise = (send?: SendCommandFunc) =>
    definition(
      currentState.context,
      event,
      (transitionName, value) =>
        send &&
        send({
          type: "transition",
          id: currentState.id,
          name: transitionName,
          value,
        })
    )
      .then((value) => {
        const newCommands: FsmCommand<AnyOptions>[] = [
          {
            type: "settle effect",
            result: "success",
            commands: [
              {
                id: currentState.id,
                type: "transition",
                name: "onDone",
                value,
              },
            ],
            effectId,
          },
        ];

        return newCommands;
      })
      .catch((error) => {
        const newCommands: FsmCommand<AnyOptions>[] = [
          {
            type: "settle effect",
            result: "error",
            commands: [
              {
                id: currentState.id,
                type: "transition",
                name: "onError",
                value: error,
              },
            ],
            effectId,
          },
        ];

        return newCommands;
      });

  return [
    {
      status: "pending",
      service: undefined,
      // promise,
    },
    undefined,
    id,
    {
      parent: currentState.id,
      id: effectId,
      name: invocation.src,
      status: "not started",
      execute: makePromise,
    },
  ];
};

const invokeMachineService = <Options extends FsmOptions>(
  machine: MachineServiceDefinition,
  parent: FsmServiceId
): [
  PendingService,
  undefined | FsmRunningMachine<AnyOptions>,
  FsmServiceId,
  undefined | FsmEffect
] => {
  const child = runMachine(machine, parent);

  // const promise = new Promise<FsmCommand<AnyOptions>[]>((resolve) =>
  //   resolve([])
  // );

  return [
    {
      status: "pending",
      service: child.state.id,
      // promise,
    },
    child,
    child.state.id,
    undefined,
  ];
};

export const invokeService = <Options extends FsmOptions>(
  currentState: FsmState<Options>,
  definition: ServiceDefinition<Options["Context"]>,
  invocation: ServiceInvocationFromOptions<Options>,
  event: FsmEvent
): [
  PendingService,
  undefined | FsmRunningMachine<AnyOptions>,
  FsmServiceId,
  undefined | FsmEffect
] => {
  if (typeof definition === "function") {
    const newServiceId = generateId(invocation.src as string);

    return invokePromiseService(
      currentState,
      newServiceId,
      definition,
      invocation,
      event
    );
  } else {
    return invokeMachineService(definition, currentState.id);
  }
};
