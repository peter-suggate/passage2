import { AnyService } from "./fsm-service-types";
import { FinalStateDefinition } from "./fsm-types";

export const getAnyFinalStateDataValue = <
  States extends object,
  Services,
  Actions,
  Context
>(
  childService: AnyService,
  finalState: string
) => {
  const finalStateDefinition = childService.machine.states[
    finalState
  ] as FinalStateDefinition<States, Services, Actions, Context>;

  let valueReturnedFromChild = undefined;
  if (finalStateDefinition.data) {
    const finalAction = childService.machine.actions[finalStateDefinition.data];
    valueReturnedFromChild = finalAction(childService.currentState.context, {
      type: "data",
    });
  }
  return valueReturnedFromChild;
};
