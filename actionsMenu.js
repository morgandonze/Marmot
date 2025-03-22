import * as p from '@clack/prompts';
import { state } from './index.js';

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
    value: {action: "Back", handler: backHandler},
    label: "> Back"
  },
  {
    value: {action: "Complete Rep", handler: completeRepHandler},
    label: "> Complete Rep"
  },
  {
    value: {action: "Complete Task", handler: completeTaskHandler},
    label: "> Complete Task"
  },
  {
    value: {action: "Abort Task", handler: abortTaskHandler},
    label: "> Abort Task"
  },
  {
    value: {action: "Edit Task", handler: editTaskHandler},
    label: "> Edit Task"
  },
  {
    value: {action: "Exit", handler: exitHandler},
    label: "> Exit"
  }
];

const actionsWithoutSelection = [
  {
    value: {action: "Add Task", handler: addTaskHandler},
    label: "> Add Task"
  },
  {
    value: {action: "Exit", handler: exitHandler},
    label: "> Exit"
  }
];

function taskSelectHandler(task) {
  return async (tasks) => {
    state.currentTask = task;
    return tasks;
  };
}

export function getMenuActions(activeTasks) {
  let actions = [];
  
  if (state.currentTask) {
    actions = [...actionsWithSelection];
  } else {
    // Add task selection options
    const taskOptions = activeTasks.map(task => ({
      value: {action: "Select Task", handler: taskSelectHandler(task)},
      label: `> ${task.description} (x${task.iteration})`
    }));
    
    actions = [...actionsWithoutSelection, ...taskOptions];
  }

  return actions;
}

export function actionsMenu(activeTasks, hasCurrentTask) {
  return async () => {
    const menuActions = getMenuActions(activeTasks);
    
    // Set initial selection to first action
    const initialValue = menuActions.length > 0 ? menuActions[0].value : null;
    
    if (!initialValue) {
      return {action: "Exit", handler: exitHandler};
    }

    return await p.select({
      message: "Select:",
      initialValue,
      options: menuActions
    });
  };
}

