import React from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { IconButton } from "@mui/material";
import { FsmCommand } from "../fsm-ts/fsm-system-types";
import { AnyOptions } from "../fsm-ts/fsm-types";
import styles from "./CommandQueue.module.css";
import { commands } from "./model";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const QueueItem = ({ command }: { command: FsmCommand<AnyOptions> }) => {
  switch (command.type) {
    case "enter": {
      return <div>{command.value}</div>;
    }
    case "execute actions": {
      return <div>Actions: {command.actions.length}</div>;
    }
    case "exit child": {
      return <div>{command.id}</div>;
    }
    case "exit state": {
      return <div>{command.value}</div>;
    }
    case "instantiate": {
      return <div>{command.machine.id}</div>;
    }
    case "invoke": {
      return <div>{command.invocation.src}</div>;
    }
    case "settle effect": {
      return <div>Commands: {command.commands.length}</div>;
    }
    case "transition": {
      return <div>Name: {command.name || "Initial state"}</div>;
    }
    case "remove effect": {
      return <div>Id: {command.effectId}</div>;
    }
  }
};

export const CommandQueue = () => {
  const allCommands = React.useSyncExternalStore(
    commands.subscribe,
    commands.data,
    commands.data
  );

  const [parent] = useAutoAnimate<HTMLDivElement>(/* optional config */);

  return (
    <div className={`${styles.commandQueue} flex`}>
      <div className="flex flex-row items-center overflow-hidden" ref={parent}>
        <div className={styles.nextWrapper}>
          <IconButton onClick={commands.tick}>
            <PlayArrowIcon />
          </IconButton>
        </div>
        {allCommands.map((c, i) => (
          //   <CSSTransition
          //     key={i}
          //     in
          //     timeout={500}
          //     classNames="commandQueueList"
          //     unmountOnExit
          //     mountOnEnter
          //     // onEntered={(node, isAppearing) => console.log(isAppearing)}
          //   >
          <div key={`${c.type}`} className={`${styles.item}`}>
            <div>{c.type}</div>
            <div className={styles.description}>
              <QueueItem command={c} />
            </div>
          </div>
          //   </CSSTransition>
        ))}
        <div className="flex-spacer" />
      </div>
    </div>
  );
};
