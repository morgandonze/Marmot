import * as p from '@clack/prompts';
import { state } from './index.js';
import { 
  TASK_STATUS,
  DEFAULT_REPEAT_INTERVAL,
  APP_TITLE 
} from './constants.js';
import {
  getCurrentTimestamp,
  generateId,
  findTaskById,
  formatTaskLabel
} from './utils.js';

export function makeNextRep(previousRep) {
  const now = getCurrentTimestamp();
  return {
    ...previousRep,
    id: state.nextID++,
    uuid: generateId(),
    iteration: previousRep.iteration + 1,
    status: TASK_STATUS.READY,
    createdAt: now,
    completedAt: null
  };
}

export function createTask(data) {
  const now = getCurrentTimestamp();
  return {
    uuid: generateId(),
    id: state.nextID++,
    iteration: 0,
    description: data.description,
    project: data.project || null,
    status: TASK_STATUS.READY,
    createdAt: now,
    completedAt: null,
    repeatInterval: data.repeatInterval || DEFAULT_REPEAT_INTERVAL
  };
}

export function optionsFromTasks(tasks) {
  return tasks.map(task => ({
    value: task,
    label: formatTaskLabel(task)
  }));
}

export async function completeRepHandler(tasks, actionInfo) {
  const confirm = await p.confirm({
    message: "Complete rep?"
  });

  if (confirm) {
    const now = getCurrentTimestamp();
    
    // First complete the current task
    Object.assign(state.currentTask, {
      status: TASK_STATUS.COMPLETED,
      completedAt: now
    });

    // Then create the next rep with the updated completedAt time
    const nextRep = makeNextRep(state.currentTask);
    tasks.push(nextRep);

    state.currentTask = null;
  }

  return tasks;
}

export async function completeTaskHandler(tasks, actionInfo) {
  const confirm = await p.confirm({
    message: "Complete task? (stops repeating)"
  });

  if (confirm) {
    Object.assign(state.currentTask, {
      status: TASK_STATUS.COMPLETED,
      completedAt: getCurrentTimestamp()
    });

    state.currentTask = null;
  }

  return tasks;
}

export async function abortTaskHandler(tasks, actionInfo) {
  const confirm = await p.confirm({
    message: "Abort rep?"
  });

  const selectedTask = actionInfo.selectedTask;

  if (confirm) {
    const now = getCurrentTimestamp();
    
    state.currentTask = null;

    Object.assign(selectedTask, {
      status: TASK_STATUS.ABORTED,
      completedAt: now
    });

    const taskIndex = findTaskById(tasks, selectedTask.uuid);
    if (taskIndex !== -1) {
      tasks[taskIndex] = selectedTask;
    }

    // Create next repetition with the updated completedAt time
    const nextRep = makeNextRep(selectedTask);
    tasks.push(nextRep);
  }

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
    placeholder: "Enter project name"
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
  return tasks;
}

export function toggleWaitingHandler(tasks) {
  state.showWaiting = !state.showWaiting;
  return tasks;
}

export function backHandler(tasks) {
  state.currentTask = null;
  return tasks;
}

export function exitHandler(tasks) {
  return tasks;
}

export function handleTask(task) {
  state.currentTask = task;
  return state.tasks;
}

