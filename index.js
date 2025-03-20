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
}
async function completeTaskHandler(tasks, actionInfo) {
  console.log("Task completed!")
}
async function abortTaskHandler(tasks, actionInfo) {
  console.log("Task aborted!")
}
async function addTaskHandler(tasks, actionInfo) {
  const taskTitle = await p.text({
    message: "New task:",
    placeholder: "Enter title"
  })
  tasks.push(createTask(taskTitle))
}
async function editTaskHandler(tasks, actionInfo) {
  console.log("Task edited!")
}

function exitHandler() {
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
    "value": {"action": "Exit", "handler": (_tasks, _actionInfo) => {}},
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
    message: selectedTask.description,
    initialValue: menuActions[0].value,
    options: menuActions
  })
}

async function main() {
  // Read options from json file
  const data = fs.readFileSync('./data.json', 'utf-8');
  const tasks = JSON.parse(data);
  let taskOptions;

  let selectedTask, menuOutput = {};

  while(menuOutput.action != "Exit") {
    taskOptions = optionsFromTasks(tasks);

    console.clear();
    selectedTask = await taskList(taskOptions)();
  
    console.clear();
    menuOutput = await actionsMenu(selectedTask)();
    await menuOutput.handler(tasks, {"selectedTask": selectedTask, "menuOutput": menuOutput});
  }

  const tasksJson = JSON.stringify(tasks)
  fs.writeFileSync('newData.json', tasksJson);

}

main().catch(console.error)
