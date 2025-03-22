import * as p from '@clack/prompts';
import { state } from './index.js';
import { ACTION_TYPES } from './constants.js';
import { formatTaskLabel } from './utils.js';

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
    value: {action: ACTION_TYPES.BACK, handler: backHandler},
    label: "> Back"
  },
  {
    value: {action: ACTION_TYPES.COMPLETE_REP, handler: completeRepHandler},
    label: "> Complete Rep"
  },
  {
    value: {action: ACTION_TYPES.COMPLETE_TASK, handler: completeTaskHandler},
    label: "> Complete Task"
  },
  {
    value: {action: ACTION_TYPES.ABORT_TASK, handler: abortTaskHandler},
    label: "> Abort Task"
  },
  {
    value: {action: ACTION_TYPES.EDIT_TASK, handler: editTaskHandler},
    label: "> Edit Task"
  },
  {
    value: {action: ACTION_TYPES.EXIT, handler: exitHandler},
    label: "> Exit"
  }
];

const actionsWithoutSelection = [
  {
    value: {action: ACTION_TYPES.ADD_TASK, handler: addTaskHandler},
    label: "> Add Task"
  },
  {
    value: {action: ACTION_TYPES.EXIT, handler: exitHandler},
    label: "> Exit"
  }
];

function createTaskOption(task) {
  return {
    value: {
      action: ACTION_TYPES.SELECT_TASK,
      handler: taskSelectHandler(task)
    },
    label: `> ${formatTaskLabel(task)}`
  };
}

function taskSelectHandler(task) {
  return async (tasks) => {
    state.currentTask = task;
    return tasks;
  };
}

export function getMenuActions(activeTasks) {
  if (state.currentTask) {
    return [...actionsWithSelection];
  }
  
  // Add task selection options
  const taskOptions = activeTasks.map(createTaskOption);
  return [...actionsWithoutSelection, ...taskOptions];
}

export function actionsMenu(activeTasks) {
  return async () => {
    const menuActions = getMenuActions(activeTasks);
    
    // Set initial selection to first action
    const initialValue = menuActions.length > 0 ? menuActions[0].value : null;
    
    if (!initialValue) {
      return {action: ACTION_TYPES.EXIT, handler: exitHandler};
    }

    return await p.select({
      message: "Select:",
      initialValue,
      options: menuActions
    });
  };
}

