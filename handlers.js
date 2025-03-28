import * as p from '@clack/prompts';
import pc from 'picocolors';
import { state } from './index.js';
import { ACTION_TYPES, TASK_STATUS, DEFAULT_REPEAT_INTERVAL, APP_TITLE } from './constants.js';
import { 
  formatTaskLabel, 
  generateId, 
  getCurrentTimestamp, 
  findTaskById, 
  makeNextRep, 
  saveData,
  formatTimeInterval,
  calculateTaskTimingStatus,
  getTaskDescriptionColor
} from './utils.js';
import { saveSettings } from './settings.js';

export function createTask(data) {
  const now = getCurrentTimestamp();
  return {
    id: state.nextID++,
    uuid: generateId(),
    description: data.description,
    project: data.project,
    repeatInterval: data.repeatInterval,
    iteration: 0,
    inProgress: true,
    successful: null,
    createdAt: now,
    completedAt: null,
    sequenceId: generateId()
  };
}

export function optionsFromTasks(tasks) {
  return tasks.map(task => ({
    value: task,
    label: formatTaskLabel(task)
  }));
}

export async function completeRepHandler(tasks, actionInfo) {
  const selectedTask = actionInfo.selectedTask;
  if (!selectedTask) return tasks;

  const now = getCurrentTimestamp();
  const taskIndex = findTaskById(tasks, selectedTask.uuid);
  if (taskIndex === -1) return tasks;

  // Mark current rep as completed
  tasks[taskIndex] = {
    ...selectedTask,
    inProgress: false,
    successful: true,
    completedAt: now
  };

  // Create next rep
  const nextRep = makeNextRep(tasks[taskIndex]);
  tasks.push(nextRep);

  // Update current task to next rep
  state.currentTask = nextRep;

  return tasks;
}

export async function completeTaskHandler(tasks, actionInfo) {
  const selectedTask = actionInfo.selectedTask;
  if (!selectedTask) return tasks;

  const now = getCurrentTimestamp();
  const taskIndex = findTaskById(tasks, selectedTask.uuid);
  if (taskIndex === -1) return tasks;

  // Mark current rep as completed
  tasks[taskIndex] = {
    ...selectedTask,
    inProgress: false,
    successful: true,
    completedAt: now
  };

  // Clear current task
  state.currentTask = null;

  return tasks;
}

export async function abortTaskHandler(tasks, actionInfo) {
  const selectedTask = actionInfo.selectedTask;
  if (!selectedTask) return tasks;

  const now = getCurrentTimestamp();
  const taskIndex = findTaskById(tasks, selectedTask.uuid);
  if (taskIndex === -1) return tasks;

  // Mark current rep as aborted
  tasks[taskIndex] = {
    ...selectedTask,
    inProgress: false,
    successful: false,
    completedAt: now
  };

  // Create next rep
  const nextRep = makeNextRep(tasks[taskIndex]);
  tasks.push(nextRep);

  // Update current task to next rep
  state.currentTask = nextRep;

  return tasks;
}

export async function addTaskHandler(tasks, actionInfo) {
  console.clear();
  p.intro(APP_TITLE);

  const taskTitle = await p.text({
    message: "New task:",
    placeholder: "Enter title"
  });

  if (!taskTitle) return tasks;

  const project = await p.text({
    message: "Project (optional):",
    placeholder: state.projectFilter || "Enter project name",
    initialValue: state.projectFilter || ""
  });

  const defaultHours = DEFAULT_REPEAT_INTERVAL / (60 * 60 * 1000);
  const repeatHours = await p.text({
    message: "Repeat interval (in hours):",
    placeholder: defaultHours.toString(),
    initialValue: defaultHours.toString(),
    validate: (value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return "Please enter a positive number";
      }
    }
  });

  if (!repeatHours) return tasks;

  const repeatInterval = parseFloat(repeatHours) * 60 * 60 * 1000; // Convert hours to milliseconds
  const newTask = createTask({
    description: taskTitle,
    project: project || null,
    repeatInterval: repeatInterval
  });
  tasks.push(newTask);
  
  return tasks;
}

export async function editTaskHandler(tasks, actionInfo) {
  const selectedTask = actionInfo.selectedTask;
  if (!selectedTask) return tasks;

  console.clear();
  p.intro(APP_TITLE);

  // Edit description
  const newTitle = await p.text({
    message: "Task description:",
    placeholder: selectedTask.description,
    initialValue: selectedTask.description
  });

  if (!newTitle) return tasks;

  // Edit project
  const newProject = await p.text({
    message: "Project (optional):",
    placeholder: "Enter project name",
    initialValue: selectedTask.project || ""
  });

  // Edit repeat interval
  const currentHours = selectedTask.repeatInterval / (60 * 60 * 1000);
  const repeatHours = await p.text({
    message: "Repeat interval (in hours):",
    placeholder: currentHours.toString(),
    initialValue: currentHours.toString(),
    validate: (value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return "Please enter a positive number";
      }
    }
  });

  if (!repeatHours) return tasks;

  // Update task with new values
  const taskIndex = findTaskById(tasks, selectedTask.uuid);
  if (taskIndex === -1) return tasks;

  const newInterval = parseFloat(repeatHours) * 60 * 60 * 1000; // Convert hours to milliseconds
  const updatedTask = {
    ...selectedTask,
    description: newTitle,
    project: newProject || null,
    repeatInterval: newInterval
  };
  
  tasks[taskIndex] = updatedTask;
  state.currentTask = updatedTask;

  return tasks;
}

export async function filterProjectHandler(tasks) {
  console.clear();
  p.intro(APP_TITLE);

  // Get unique projects, including tasks without projects
  const projects = [...new Set(tasks
    .map(t => t.project)
    .filter(p => p !== null)
  )].sort();

  // Add options for all projects and no filter
  const options = [
    { value: null, label: "Clear project filter" },
    ...projects.map(p => ({ value: p, label: p })),
    { value: "__no_project__", label: "No project" }
  ];

  const selectedProject = await p.select({
    message: "Filter by project:",
    options: options
  });

  state.projectFilter = selectedProject;
  const { nextID, currentTask, tasks: _, ...settings } = state;
  saveSettings(settings);
  return tasks;
}

export async function showHistoryHandler(tasks, actionInfo) {
  const selectedTask = actionInfo.selectedTask;
  if (!selectedTask) return tasks;

  console.clear();
  p.intro(APP_TITLE);

  // Find all tasks in the same sequence
  const sequenceTasks = tasks
    .filter(t => t.sequenceId === selectedTask.sequenceId)
    .sort((a, b) => b.iteration - a.iteration); // Reversed sort order

  // Calculate completion percentage excluding pending tasks
  const completedTasks = sequenceTasks.filter(t => !t.inProgress && t.successful !== false).length;
  const nonPendingTasks = sequenceTasks.filter(t => !t.inProgress).length;
  const completionPercentage = nonPendingTasks > 0 
    ? (completedTasks / nonPendingTasks * 100).toFixed(1)
    : "0.0";

  // Display task history
  p.log.message(`\nHistory for task: ${selectedTask.description}`);
  p.log.message(`Project: ${selectedTask.project || 'None'}`);
  p.log.message(`Repeat Interval: ${formatTimeInterval(selectedTask.repeatInterval)}`);
  p.log.message(`Completion Rate: ${pc.yellowBright(completionPercentage + "%")}`);
  p.log.message(`(${completedTasks}/${nonPendingTasks} repetitions completed)`);
  p.log.message('\nMost recent repetitions:');
  
  // Display only the 8 most recent entries
  for (const task of sequenceTasks.slice(0, 8)) {
    const date = task.completedAt ? 
      pc.gray(new Date(task.completedAt).toLocaleString()) : 
      pc.gray('Not completed');
    const status = task.successful === true ? 
      pc.green('Success') : 
      task.successful === false ? 
        pc.red('Failed') : 
        pc.gray('Pending');
    p.log.message(`#${task.iteration} - ${date} - ${status}`);
  }

  // If there are more entries, show a count
  if (sequenceTasks.length > 8) {
    p.log.message(`\n... and ${sequenceTasks.length - 8} more entries`);
  }

  // Wait for user acknowledgment
  await p.text({
    message: "Press Enter to continue"
  });

  return tasks;
}

export function toggleWaitingHandler(tasks) {
  state.showWaiting = !state.showWaiting;
  const { nextID, currentTask, tasks: _, ...settings } = state;
  saveSettings(settings);
  return tasks;
}

export function backHandler(tasks) {
  state.currentTask = null;
  return tasks;
}

export async function exitHandler(tasks) {
  saveData(tasks);
  return tasks;
}

export function handleTask(task) {
  state.currentTask = task;
  return state.tasks;
}

export function toggleDetailedInfoHandler(tasks) {
  state.showDetailedInfo = !state.showDetailedInfo;
  const { nextID, currentTask, tasks: _, ...settings } = state;
  saveSettings(settings);
  return tasks;
}

export async function settingsMenuHandler(tasks) {
  const settingsOptions = [
    {
      value: {action: ACTION_TYPES.TOGGLE_WAITING, handler: toggleWaitingHandler},
      get label() {
        return `[ ${state.showWaiting ? 'Hide' : 'Show'} Waiting Tasks ]`;
      }
    },
    {
      value: {action: ACTION_TYPES.FILTER_PROJECT, handler: filterProjectHandler},
      get label() {
        return `[ ${state.projectFilter ? 'Change' : 'Set'} Project Filter ]`;
      }
    },
    {
      value: {action: ACTION_TYPES.TOGGLE_DETAILED_INFO, handler: toggleDetailedInfoHandler},
      get label() {
        return `[ ${state.showDetailedInfo ? 'Hide' : 'Show'} Detailed Info ]`;
      }
    },
    {
      value: {action: ACTION_TYPES.BACK, handler: backHandler},
      label: "[ Back ]"
    }
  ];

  const result = await p.select({
    message: "Settings:",
    options: settingsOptions
  });

  if (result.action === ACTION_TYPES.BACK) {
    return tasks;
  }

  return await result.handler(tasks);
}

export const actionsWithoutSelection = [
  {
    value: {action: ACTION_TYPES.EXIT, handler: exitHandler},
    label: "[ Exit ]"
  },
  {
    value: {action: ACTION_TYPES.SETTINGS, handler: settingsMenuHandler},
    label: "[ Settings ]"
  },
  {
    value: {action: ACTION_TYPES.ADD_TASK, handler: addTaskHandler},
    label: "[ Add Task ]"
  }
];

