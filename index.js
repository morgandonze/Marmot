import * as p from '@clack/prompts';
import pc from 'picocolors';
import { actionsMenu } from './actionsMenu.js';
import { APP_TITLE, TASK_STATUS } from './constants.js';
import { 
  loadData, 
  saveData, 
  formatTaskLabel, 
  getCurrentTimestamp, 
  formatTimeInterval,
  calculateTaskTimingStatus,
  getTaskDescriptionColor
} from './utils.js';
import { loadSettings, saveSettings } from './settings.js';

// Global state object
let state = {
  nextID: 0,
  currentTask: null,
  tasks: [],
  ...loadSettings()
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

    const now = getCurrentTimestamp();

    // Sort tasks by ready time
    const sortedTasks = tasks
      .filter(task => {
        if (state.projectFilter === null) return true;
        if (state.projectFilter === "__no_project__") return !task.project;
        return task.project === state.projectFilter;
      })
      .sort((a, b) => {
        const aReadyTime = a.createdAt + a.repeatInterval;
        const bReadyTime = b.createdAt + b.repeatInterval;
        const aTimeUntilDue = aReadyTime - now;
        const bTimeUntilDue = bReadyTime - now;
        return aTimeUntilDue - bTimeUntilDue;
      });
    
    const activeTasks = sortedTasks.filter(task => {
      // Check status
      if (!task.inProgress) return false;
      
      // First iterations are shown immediately and are never waiting
      if (task.iteration === 0) return true;
      
      // For subsequent iterations, check if enough time has passed since creation
      const readyTime = task.createdAt + task.repeatInterval;
      const timeToReady = readyTime - now;
      const percentToReady = (timeToReady / task.repeatInterval) * 100;
      
      // Show task if:
      // 1. It's ready (past ready time)
      // 2. showWaiting is true
      // 3. It's almost ready (within 10% of ready time)
      return state.showWaiting || now >= readyTime || percentToReady <= 10;
    });
    
    // Only show filters if no task is selected
    if (!state.currentTask) {
      p.log.message(`\nShowing ${state.showWaiting ? 'all' : 'only ready'} tasks`);
      if (state.projectFilter === "__no_project__") {
        p.log.message(`Filtered to tasks without projects`);
      } else if (state.projectFilter) {
        p.log.message(`Filtered to project: ${state.projectFilter}`);
      }
    }
    
    if (state.currentTask) {
      const task = state.currentTask;
      const createdDate = new Date(task.createdAt).toLocaleString();
      
      // Calculate completion rate for the sequence
      const sequenceTasks = state.tasks.filter(t => t.sequenceId === task.sequenceId);
      const completedTasks = sequenceTasks.filter(t => !t.inProgress && t.successful !== false).length;
      const nonPendingTasks = sequenceTasks.filter(t => !t.inProgress).length;
      const completionPercentage = nonPendingTasks > 0 
        ? (completedTasks / nonPendingTasks * 100).toFixed(1)
        : "0.0";
      
      // Calculate timing status using utility function
      const { status: timingStatus, info: timingInfo } = calculateTaskTimingStatus(task, now);
      
      // Get description color using utility function
      const descriptionColor = getTaskDescriptionColor(task, now);
      
      p.log.message(descriptionColor(`${task.description}${task.project ? ` [${task.project}]` : ''}`));
      p.log.message(`Completion Rate: ${pc.yellowBright(completionPercentage + "%")} (${completedTasks}/${nonPendingTasks} completed)`);
      p.log.message(`Status: ${timingStatus}${timingInfo ? ` (${timingInfo})` : ''}`);
      p.log.message(`Repeat Interval: ${formatTimeInterval(task.repeatInterval)}`);
      p.log.message(`Iteration: ${task.iteration}`);
    }

    output = await actionsMenu(activeTasks)();
    
    if (output && output.handler) {
      state.tasks = await output.handler(state.tasks, {
        selectedTask: state.currentTask,
        menuOutput: output
      });
      
      // Save settings after any handler that might modify them
      const { nextID, currentTask, tasks: _, ...settings } = state;
      saveSettings(settings);
    }
  }
}

main().catch(console.error);
