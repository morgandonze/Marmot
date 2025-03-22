import * as p from '@clack/prompts';
import pc from 'picocolors';
import { state } from './index.js';
import { ACTION_TYPES } from './constants.js';
import { formatTaskLabel } from './utils.js';

import {
  exitHandler,
  completeRepHandler,
  completeTaskHandler,
  abortTaskHandler,
  addTaskHandler,
  editTaskHandler,
  backHandler,
  toggleWaitingHandler,
  filterProjectHandler,
  showHistoryHandler
} from './handlers.js'

const actionsWithSelection = [
  {
    value: {action: ACTION_TYPES.BACK, handler: backHandler},
    label: pc.cyan("[ Back ]")
  },
  {
    value: {action: ACTION_TYPES.COMPLETE_REP, handler: completeRepHandler},
    label: pc.cyan("[ Complete Rep ]")
  },
  {
    value: {action: ACTION_TYPES.COMPLETE_TASK, handler: completeTaskHandler},
    label: pc.cyan("[ Complete Task ]")
  },
  {
    value: {action: ACTION_TYPES.ABORT_TASK, handler: abortTaskHandler},
    label: pc.cyan("[ Abort Task ]")
  },
  {
    value: {action: ACTION_TYPES.EDIT_TASK, handler: editTaskHandler},
    label: pc.cyan("[ Edit Task ]")
  },
  {
    value: {action: ACTION_TYPES.SHOW_HISTORY, handler: showHistoryHandler},
    label: pc.cyan("[ Show History ]")
  },
  {
    value: {action: ACTION_TYPES.EXIT, handler: exitHandler},
    label: pc.cyan("[ Exit ]")
  }
];

const actionsWithoutSelection = [
  {
    value: {action: ACTION_TYPES.TOGGLE_WAITING, handler: toggleWaitingHandler},
    get label() {
      return pc.cyan(`[ ${state.showWaiting ? 'Hide' : 'Show'} Waiting Tasks ]`);
    }
  },
  {
    value: {action: ACTION_TYPES.FILTER_PROJECT, handler: filterProjectHandler},
    get label() {
      return pc.cyan(`[ ${state.projectFilter ? 'Change' : 'Set'} Project Filter ]`);
    }
  },
  {
    value: {action: ACTION_TYPES.EXIT, handler: exitHandler},
    label: pc.cyan("[ Exit ]")
  },
  {
    value: {action: ACTION_TYPES.ADD_TASK, handler: addTaskHandler},
    label: pc.cyan("[ Add Task ]")
  }
];

function createTaskOption(task) {
  return {
    value: {
      action: ACTION_TYPES.SELECT_TASK,
      handler: taskSelectHandler(task)
    },
    label: formatTaskLabel(task)
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
  
  // Add task selection options first, then menu actions
  const taskOptions = activeTasks.map(createTaskOption);
  return [...taskOptions, ...actionsWithoutSelection];
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

