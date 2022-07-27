import { pipe } from "fp-ts/lib/function";
import { menuMachine } from "../examples/practice/menuMachine";
import type { FsmRep } from "../fsm-ts/fsm-system-types";
import { commandStore, fsmStore } from "../fsm-ts/fsmStore";
import { command, emptySystem, exhaust, tick } from "../fsm-ts/fsmSystem";
import { graphStore } from "./graphStore";

export const commands = commandStore();

const empty: FsmRep = [emptySystem(), []];

const fsm = fsmStore(commands)(
  pipe(
    empty,
    command({ type: "instantiate", machine: menuMachine }),
    exhaust()
    // command({
    //   type: "transition",
    //   id: "Passage",
    //   name: "free practice",
    // })
    // command({
    //   type: "transition",
    //   id: "Passage",
    //   name: "random piece",
    // }),
    // exhaust()
  )[0]
);

// commands.send({ type: "transition", id: "Passage", name: "free practice" });
commands.exhaust();
// fsm.waitForAllEffects().then(() => commands.exhaust());

export const graph = graphStore(commands, fsm);
