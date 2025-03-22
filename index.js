import * as p from '@clack/prompts';
import pc from 'picocolors';
import { actionsMenu } from './actionsMenu.js';
import { APP_TITLE, TASK_STATUS } from './constants.js';
import { loadData, saveData, formatTaskLabel, getCurrentTimestamp, formatTimeInterval } from './utils.js';

// Global state object
let state = {
  nextID: 0,
  currentTask: null,
  tasks: [],
  showWaiting: false,
  projectFilter: null
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

    const activeTasks = state.tasks.filter(task => {
      // Check status
      if (!task.inProgress) return false;
      
      // Check project filter
      if (state.projectFilter === "__no_project__") {
        // Show only tasks with no project
        if (task.project !== null) return false;
      } else if (state.projectFilter !== null) {
        // Show tasks matching specific project
        if (task.project !== state.projectFilter) return false;
      }
      
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
      
      // Calculate timing status
      let timingStatus = task.inProgress ? "in progress" : 
                        task.successful === true ? "completed (on time)" :
                        task.successful === false ? "aborted" : "completed (late)";
      let timingInfo = '';
      
      // Calculate timing variables for both status and color
      const readyTime = task.createdAt + task.repeatInterval;
      const timeSinceReady = now - readyTime;
      const timeToReady = readyTime - now;
      const percentSinceReady = (timeSinceReady / task.repeatInterval) * 100;
      const percentToReady = (timeToReady / task.repeatInterval) * 100;
      
      if (task.inProgress) {
        if (readyTime > now) {
          // Task is waiting
          timingStatus = percentToReady <= 10 ? "almost ready" : "waiting";
          timingInfo = `Ready in ${formatTimeInterval(timeToReady)}`;
        } else if (timeSinceReady >= task.repeatInterval) {
          timingStatus = "overdue";
          timingInfo = `Overdue by ${formatTimeInterval(timeSinceReady - task.repeatInterval)}`;
        } else if (percentSinceReady >= 60) {
          timingStatus = "almost overdue";
          timingInfo = `Due in ${formatTimeInterval(task.repeatInterval - timeSinceReady)}`;
        } else if (timeSinceReady > 0) {
          timingStatus = "ready";
          timingInfo = `Due in ${formatTimeInterval(task.repeatInterval - timeSinceReady)}`;
        }
      }
      
      // Color the description based on status
      let descriptionColor = pc.white;
      if (task.inProgress) {
        if (readyTime > now) {
          // Task is waiting
          descriptionColor = percentToReady <= 10 ? pc.magenta : pc.cyan;
        } else if (timeSinceReady >= task.repeatInterval) {
          descriptionColor = pc.red;
        } else if (percentSinceReady >= 60) {
          descriptionColor = pc.yellow;
        }
      }
      
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
    }
  }

  // Save state before exit
  saveData(state.tasks);
}

main().catch(console.error);
