import { setTimeout } from 'node:timers/promises';
import * as p from '@clack/prompts';
import color from 'picocolors';

import * as fs from 'fs';

function createTask(title) {
  return {
    description: title,
    status: "ready",
    createdAt: (new Date()).getTime(),
    completedAt: null
  }
}

function optionsFromTasks(tasks) {
  return tasks.map(task => {
    return {
      value: task,
      label: task.description
    }
  })
}

async function completeRepHandler(tasks, actionInfo) {
  console.log("Rep completed!")
  
  return tasks;
}

async function completeTaskHandler(tasks, actionInfo) {
  console.log("Task completed!")
  
  return tasks;
}

async function abortTaskHandler(tasks, actionInfo) {
  console.log("Task aborted!")
  
  return tasks;
}

async function addTaskHandler(tasks, actionInfo) {
  const taskTitle = await p.text({
    message: "New task:",
    placeholder: "Enter title"
  })
  tasks.push(createTask(taskTitle))
  
  return tasks;
}

async function editTaskHandler(tasks, actionInfo) {
  console.log("Task edited!")

  return tasks;
}

function exitHandler(tasks, actionInfo) {
  return tasks;
}

const menuActions = [
  {
    "value": {"action": "Complete Rep", "handler": completeRepHandler},
    "label": "Complete Rep"
  },
  {
    "value": {"action": "Complete Task", "handler": completeTaskHandler},
    "label": "Complete Task"
  },
  {
    "value": {"action": "Abort Task", "handler": abortTaskHandler},
    "label": "Abort task"
  },
  {
    "value": {"action": "Add Task", "handler": addTaskHandler},
    "label": "Add Task"
  },
  {
    "value": {"action": "Edit Task", "handler": editTaskHandler},
    "label": "Edit Task"
  },
  {
    "value": {"action": "Exit", "handler": exitHandler},
    "label": "Exit"
  }
]

function taskList(tasks) {
  return () => p.select({
    message: "Tasks:",
    maxItems: 1,
    initialValue: tasks[0].value,
    options: tasks
  })
}

function actionsMenu(selectedTask) {
  return () => p.select({
    message: "Task: [" + selectedTask.description + "]",
    initialValue: menuActions[0].value,
    options: menuActions
  })
}

async function main() {
  const data = fs.readFileSync('./data.json', 'utf-8');
  let tasks = JSON.parse(data);
  let taskOptions;

  let selectedTask, menuOutput = {};

  while(menuOutput.action != "Exit") {
    taskOptions = optionsFromTasks(tasks);

    console.clear();
    p.intro("Marmot!")
    selectedTask = await taskList(taskOptions)();
  
    console.clear();
    p.intro("Marmot!")
    menuOutput = await actionsMenu(selectedTask)();
    tasks = await menuOutput.handler(tasks, {"selectedTask": selectedTask, "menuOutput": menuOutput});
  }

  const tasksJson = JSON.stringify(tasks)
  fs.writeFileSync('newData.json', tasksJson);

}

main().catch(console.error)
