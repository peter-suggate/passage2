import { AnyService } from "./fsm-service-types";
import { FinalStateDefinition, FsmOptions } from "./fsm-types";

export const getAnyFinalStateDataValue = <Options extends FsmOptions>(
  childService: AnyService,
  finalState: string
) => {
  const finalStateDefinition = childService.machine.states[
    finalState
  ] as FinalStateDefinition<
    Options["States"],
    Options["Services"],
    Options["Actions"],
    Options["Context"]
  >;

  let valueReturnedFromChild = undefined;
  if (finalStateDefinition.data) {
    const finalAction = childService.machine.actions[finalStateDefinition.data];
    valueReturnedFromChild = finalAction(childService.currentState.context, {
      type: "data",
    });
  }
  return valueReturnedFromChild;
};
