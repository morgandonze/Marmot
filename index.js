import * as p from '@clack/prompts';
import { actionsMenu } from './actionsMenu.js';
import { APP_TITLE, TASK_STATUS } from './constants.js';
import { loadData, saveData, formatTaskLabel, getCurrentTimestamp } from './utils.js';

// Global state object
let state = {
  nextID: 0,
  currentTask: null,
  tasks: [],
  showWaiting: false
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
      const task = state.currentTask;
      const createdDate = new Date(task.createdAt).toLocaleString();
      p.log.message(`Current task details:`);
      p.log.message(`Description: ${task.description}`);
      p.log.message(`Iteration: ${task.iteration}`);
      p.log.message(`Status: ${task.status}`);
      p.log.message(`Created: ${createdDate}`);
      p.log.message(`Repeat Interval: ${task.repeatInterval / (60 * 60 * 1000)} hours`);
    }

    const now = getCurrentTimestamp();
    const activeTasks = state.tasks.filter(task => {
      const isReady = task.status === TASK_STATUS.READY;
      const isTimeToShow = now >= task.nextShowTime;
      
      return isReady && (state.showWaiting || isTimeToShow);
    });
    
    // Show current display mode
    p.log.message(`\nShowing ${state.showWaiting ? 'all' : 'only ready'} tasks`);
    
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
