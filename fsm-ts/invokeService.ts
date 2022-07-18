import { generateId } from "./fsm-core-util";
import type {
  FsmRunningMachine,
  FsmState,
  PendingService,
  FsmInterpreterCommand,
  FsmServiceId,
} from "./fsm-service-types";
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

type ServiceInvocationFromOptions<Options extends FsmOptions> =
  ServiceInvocation<
    Options["States"],
    Options["Services"],
    Options["Actions"],
    Options["Context"]
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
  FsmServiceId
] => {
  const promise = definition(currentState.context, event)
    .then((value) => {
      const newCommands: FsmInterpreterCommand<AnyOptions>[] = [
        {
          type: "exit child service",
          id: currentState.id,
          child: id,
          // result: value,
        },
      ];

      invocation.onDone &&
        newCommands.push({
          id: currentState.id,
          type: "transition",
          name: "onDone",
          value,
        });

      return newCommands;
    })
    .catch((error) => {
      const newCommands: FsmInterpreterCommand<AnyOptions>[] = [
        {
          type: "exit child service",
          id: currentState.id,
          child: id,
          // result: error,
        },
      ];

      invocation.onError &&
        newCommands.push({
          type: "transition",
          id: currentState.id,
          name: "onError",
          value: error,
        });

      return newCommands;
    });

  return [
    {
      status: "pending",
      service: undefined,
      promise,
    },
    undefined,
    id,
  ];
};

const invokeMachineService = <Options extends FsmOptions>(
  machine: MachineServiceDefinition,
  parent: FsmServiceId
): [
  PendingService,
  undefined | FsmRunningMachine<AnyOptions>,
  FsmServiceId
] => {
  const child = runMachine(machine, parent);

  const promise = new Promise<FsmInterpreterCommand<AnyOptions>[]>((resolve) =>
    resolve([])
  );

  return [
    {
      status: "pending",
      service: child.state.id,
      promise,
    },
    child,
    child.state.id,
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
  FsmServiceId
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
