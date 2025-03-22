import { setTimeout } from 'node:timers/promises';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { handleTask } from './handlers.js';
import { actionsMenu } from './actionsMenu.js';
import { APP_TITLE, TASK_STATUS } from './constants.js';
import { loadData, saveData, formatTaskLabel } from './utils.js';

// Global state object
let state = {
  nextID: 0,
  currentTask: null,
  tasks: []
};

export { state };

async function main() {
  // Initialize or load existing data
  const tasks = loadData();
  state.tasks = tasks;
  
  // Set nextID based on existing tasks
  state.nextID = tasks.length > 0 
    ? Math.max(...tasks.map(t => t.id)) + 1 
    : 0;

  let output = {};

  while (output.action !== "Exit") {
    console.clear();
    p.intro(APP_TITLE);

    if (state.currentTask) {
      p.log.message(
        `Current task: ${formatTaskLabel(state.currentTask)}`
      );
    }

    const activeTasks = state.tasks.filter(
      (task) => task.status === TASK_STATUS.READY
    );
    
    output = await actionsMenu(activeTasks)();
    
    if (output && output.handler) {
      state.tasks = await output.handler(state.tasks, {
        selectedTask: state.currentTask,
        menuOutput: output
      });
    }
  }

  // Save state before exit
  saveData(state.tasks);
}

main().catch(console.error);
