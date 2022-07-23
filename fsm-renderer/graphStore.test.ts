import { createMachine } from "../fsm-ts/createMachine";
import { sleep } from "../fsm-ts/fsm-core-util";
import { commandStore, fsmStore } from "../fsm-ts/fsmStore";
import { emptySystem } from "../fsm-ts/fsmSystem";
import { graphStore } from "./graphStore";

const machine = createMachine({
  id: "machine",
  initial: "state1",
  states: {
    state1: {
      on: {
        transition1: { target: "state2" },
        transition2: { target: "state3" },
      },
    },
    state2: {
      on: { transition: { target: "state3" } },
    },
    state3: { type: "final" },
  },
});

it("", async () => {
  const commands = commandStore();
  const fsm = fsmStore(commands)(emptySystem());

  const store = graphStore(commands, fsm);

  const listener = jest.fn((e) => {
    // console.warn(fsm.data());
    console.warn(store.getSnapshot());
  });

  store.subscribe(listener);
  //   expect(listener).toBeCalledWith({ type: "initial" });
  //   listener.mockClear();

  commands.send({ type: "instantiate", machine, parent: undefined });
  commands.exhaust();
  await sleep(1000);

  //   expect(listener).toBeCalledWith();
  //   listener.mockClear();
});
