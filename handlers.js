import * as p from '@clack/prompts';
import { v4 as uuidv4 } from 'uuid';
import { state } from './index.js';

const defaultRepeatInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function getNextId() {
  return state.nextID++;
}

export function makeNextRep(previousRep) {
  const nextRep = Object.assign({}, previousRep);
  return Object.assign(nextRep, {
    id: getNextId(),
    uuid: uuidv4(),
    iteration: previousRep.iteration + 1,
    status: "ready",
    createdAt: (new Date()).getTime(),
    completedAt: null
  });
}

export function createTask(data) {
  const task = {
    uuid: uuidv4(),
    id: getNextId(),
    iteration: 0,
    description: data.description,
    status: "ready",
    createdAt: (new Date()).getTime(),
    completedAt: null,
    repeatInterval: defaultRepeatInterval
  };
  return task;
}

export function optionsFromTasks(tasks) {
  return tasks.map(task => ({
    value: task,
    label: task.description
  }));
}

export async function completeRepHandler(tasks, actionInfo) {
  const confirm = await p.confirm({
    message: "Complete rep?"
  });

  if (confirm) {
    const nextRep = makeNextRep(state.currentTask);
    tasks.push(nextRep);

    Object.assign(state.currentTask, {
      status: "completed",
      completedAt: (new Date()).getTime()
    });

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
      status: "completed",
      completedAt: (new Date()).getTime()
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
    state.currentTask = null;

    Object.assign(selectedTask, {
      status: "aborted",
      completedAt: (new Date()).getTime()
    });

    const taskIndex = tasks.findIndex(t => t.uuid === selectedTask.uuid);
    if (taskIndex !== -1) {
      tasks[taskIndex] = selectedTask;
    }

    // Create next repetition
    const nextRep = makeNextRep(selectedTask);
    tasks.push(nextRep);
  }

  return tasks;
}

export async function addTaskHandler(tasks, actionInfo) {
  console.clear();
  p.intro("[ Marmot ]");

  const taskTitle = await p.text({
    message: "New task:",
    placeholder: "Enter title"
  });

  if (taskTitle) {
    const newTask = createTask({description: taskTitle});
    tasks.push(newTask);
  }
  
  return tasks;
}

export async function editTaskHandler(tasks, actionInfo) {
  const selectedTask = actionInfo.selectedTask;
  if (!selectedTask) return tasks;

  const newTitle = await p.text({
    message: "Edit task:",
    placeholder: selectedTask.description
  });

  if (newTitle) {
    const taskIndex = tasks.findIndex(t => t.uuid === selectedTask.uuid);
    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...selectedTask, description: newTitle };
    }
  }

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

