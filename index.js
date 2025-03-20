import { setTimeout } from 'node:timers/promises';
import * as p from '@clack/prompts';
import color from 'picocolors';

import * as fs from 'fs';

function listHandler(options) {
  return () => p.select({
      message: 'Choose an item',
      initialValue: options[0].value,
      options: options
    });
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
  tasks.push({
    "value": taskTitle,
    "label": taskTitle
  })
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
    "value": {"action": "Exit", "handler": (tasks, actionInfo) => {}},
    "label": "Exit"
  }
]

function taskList(tasks) {
  return () => p.select({
    message: "Tasks:",
    initialValue: tasks[0].value,
    options: tasks
  })
}

function actionsMenu(selectedTask) {
  return () => p.select({
    message: selectedTask,
    initialValue: menuActions[0].value,
    options: menuActions
  })
}

async function main() {
  // Read options from json file
  const data = fs.readFileSync('./data.json', 'utf-8');
  const tasks = JSON.parse(data);
  let listOutput, menuOutput;

  while(!menuOutput || menuOutput.action != "Exit") {
    console.clear();
    listOutput = await taskList(tasks)();
  
    console.clear();
    menuOutput = await actionsMenu(listOutput)();
    await menuOutput.handler(tasks, {"listOutput": listOutput, "menuOutput": menuOutput});
  }

}

main().catch(console.error)
