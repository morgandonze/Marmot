import * as p from '@clack/prompts';

import {
  handleTask,
  optionsFromTasks,
  createTask,
  exitHandler,
  makeNextRep,
  completeRepHandler,
  completeTaskHandler,
  abortTaskHandler,
  addTaskHandler,
  editTaskHandler,
  backHandler
} from './handlers.js'

const actionsWithSelection = [
      {
        "value": {"action": "Back", "handler": backHandler},
        "label": "> Back"
      },
      {
        "value": {"action": "Complete Rep", "handler": completeRepHandler},
        "label": "> Complete Rep"
      },
      {
        "value": {"action": "Complete Task", "handler": completeTaskHandler},
        "label": "> Complete Task"
      },
      {
        "value": {"action": "Abort Task", "handler": abortTaskHandler},
        "label": "> Abort Task"
      },
      {
        "value": {"action": "Edit Task", "handler": editTaskHandler},
        "label": "> Edit Task"
      },
      {
        "value": {"action": "Exit", "handler": exitHandler},
        "label": "> Exit"
      }
    ]


const actionsWithoutSelection = [
      {
        "value": {"action": "Exit", "handler": exitHandler},
        "label": "> Exit"
      },
      {
        "value": {"action": "Add Task", "handler": addTaskHandler},
        "label": "> Add Task"
      }
    ]

function taskSelectHandler() {
  return {
    "value": {"action": "select task", "handler": () => {}},
    "label": "> select task"
  }
}

function taskMenuAction() {
  return {
    "value": {"action": "Set task", "handler": taskSelectHandler()},
    "label": task.description
  }
}

export function getMenuActions(activeTasks) {
  const taskSelectorActions = activeTasks.map(() => {})

  let actions = [];

  //if (!!state.currentTask) {
    //actions = actions.concat(actionsWithSelection);
  //} else {
    actions = actions.concat(actionsWithoutSelection);
    //actions = actions.concat(taskSelectorActions);
  //}

  return actions;
}

export function actionsMenu(activeTasks, hasCurrentTask) {
  const menuActions = getMenuActions(activeTasks);

  let initialIndex =
    hasCurrentTask ?
      0 :
      menuActions.length > 2 ?
        2 :
        1

  return () => p.select({
    message: "Select:",
    initialValue: menuActions[initialIndex].value,
    options: menuActions
  });
};

