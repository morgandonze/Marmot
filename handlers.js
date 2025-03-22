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

  const editChoice = await p.select({
    message: "What would you like to edit?",
    options: [
      { value: 'description', label: 'Task Description' },
      { value: 'interval', label: 'Repeat Interval' }
    ]
  });

  if (!editChoice) return tasks;

  const taskIndex = findTaskById(tasks, selectedTask.uuid);
  if (taskIndex === -1) return tasks;

  if (editChoice === 'description') {
    const newTitle = await p.text({
      message: "Edit task description:",
      placeholder: selectedTask.description
    });

    if (newTitle) {
      const updatedTask = { ...selectedTask, description: newTitle };
      tasks[taskIndex] = updatedTask;
      state.currentTask = updatedTask;
    }
  } else if (editChoice === 'interval') {
    const currentHours = selectedTask.repeatInterval / (60 * 60 * 1000);
    const newHours = await p.text({
      message: "Enter new repeat interval (in hours):",
      placeholder: currentHours.toString(),
      validate: (value) => {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          return "Please enter a positive number";
        }
      }
    });

    if (newHours) {
      const newInterval = parseFloat(newHours) * 60 * 60 * 1000; // Convert hours to milliseconds
      const updatedTask = { ...selectedTask, repeatInterval: newInterval };
      tasks[taskIndex] = updatedTask;
      state.currentTask = updatedTask;
    }
  }

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

