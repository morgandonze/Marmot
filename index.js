import { setTimeout } from 'node:timers/promises';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { v4 as uuidv4 } from 'uuid';

import * as fs from 'fs';

let nextID = 0;
const marmotTitle = "[ Marmot ]"
let currentTask;

let defaultRepeatInterval = 1000*60*60*24;

function getNextId() {
  nextID++;
  return nextID;
}

function createTask(data) {
  return {
    uuid: uuidv4(),
    id: getNextId(),
    iteration: 0,
    description: data.description,
    status: "ready",
    createdAt: (new Date()).getTime(),
    completedAt: null,
    repeatInterval: defaultRepeatInterval
  }

  nextID++;
}

function makeNextRep(previousRep) {
  const nextRep = Object.assign({}, previousRep);
  return Object.assign(nextRep, {
    id: getNextId(),
    uuid: uuidv4(),
    iteration: previousRep.iteration + 1,
    status: "ready",
    createdAt: (new Date()).getTime(),
    completedAt: null
  })
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
  const confirm = await p.confirm({
    message: "Complete rep?"
  })

  const selectedTask = actionInfo.selectedTask;

  if (confirm) {
    currentTask = null;

    tasks.slice(selectedTask.index, 0, selectedTask);
    Object.assign(selectedTask, {
      status: "completed",
      completedAt: (new Date()).getTime()
    })

    // Create next repetition
    const nextRep = makeNextRep(selectedTask);
    tasks.push(nextRep);
  }

  return tasks;
}

async function completeTaskHandler(tasks, actionInfo) {
  const confirm = await p.confirm({
    message: "Complete task? (stops repeating)"
  })

  const selectedTask = actionInfo.selectedTask;

  if (confirm) {
    currentTask = null;

    Object.assign(selectedTask, {
      status: "completed",
      completedAt: (new Date()).getTime()
    })

    tasks.splice(selectedTask.index, 1);
  }

  return tasks;
}


async function abortTaskHandler(tasks, actionInfo) {
  console.log("Task aborted!")
  
  return tasks;
}

async function addTaskHandler(tasks, actionInfo) {
  console.clear();
  p.intro(marmotTitle);

  const taskTitle = await p.text({
    message: "New task:",
    placeholder: "Enter title"
  })
  tasks.push(createTask({description: taskTitle}))
  
  return tasks;
}

async function editTaskHandler(tasks, actionInfo) {
  console.log("Task edited!")

  return tasks;
}

function backHandler(tasks) {
  currentTask = null;
  return tasks
};

function exitHandler(tasks, actionInfo) {
  return tasks;
}

function setCurrentTaskHandler(tasks, task) {
  return () => {
    currentTask = task;
    return tasks;
  }
}

function taskMenuAction(tasks, task) {
  return {
    "value": {"action": "Set task", "handler": setCurrentTaskHandler(tasks, task)},
    "label": task.description
  }
}

function getMenuActions(tasks, hasSelection) {
  let actions = []
  if (hasSelection) {
    actions = actions.concat([
      {
        "value": {"action": "Back", "handler": backHandler},
        "label": "> Back"
      },
      {
        "value": {"action": "Complete Rep", "handler": completeRepHandler},
        "label": "> Complete Rep"
      },
      {
        "value": {"action": "Complete Task", "handler": completeTaskHandler},
        "label": "> Complete Task"
      },
      {
        "value": {"action": "Abort Task", "handler": abortTaskHandler},
        "label": "> Abort Task"
      },
      {
        "value": {"action": "Edit Task", "handler": editTaskHandler},
        "label": "> Edit Task"
      },
      {
        "value": {"action": "Exit", "handler": exitHandler},
        "label": "> Exit"
      }
    ])
  } else {
    actions = actions.concat([
      {
        "value": {"action": "Exit", "handler": exitHandler},
        "label": "> Exit"
      },
      {
        "value": {"action": "Add Task", "handler": addTaskHandler},
        "label": "> Add Task"
      }
    ])

    actions = actions.concat(tasks.map(task => taskMenuAction(tasks, task)))
  }

  return actions;
}

function actionsMenu(tasks, selectedTask) {
  const hasSelectedTask = !!selectedTask;
  const initialIndex = hasSelectedTask ? 0 : 2;
  const menuActions = getMenuActions(tasks, hasSelectedTask)

  return () => p.select({
    message: "Select:",
    initialValue: menuActions[initialIndex].value,
    options: menuActions
  })
}

async function main() {
  const data = fs.readFileSync('./data.json', 'utf-8');
  let tasks = JSON.parse(data);
  let activeTasks, taskOptions;
  let selectedTask;
  let output = {};

  while(output.action != "Exit") {
    activeTasks = tasks.filter((task) => (task.status == "ready"))
    taskOptions = optionsFromTasks(activeTasks);

    console.clear();

    p.intro(marmotTitle);
    if (currentTask) {
      p.log.message("Current task: " + currentTask.description + " x" + currentTask.iteration);
    }

    output = await actionsMenu(activeTasks, currentTask)();
    tasks = await output.handler(tasks, {"selectedTask": currentTask, "menuOutput": output});
  }

  const tasksJson = JSON.stringify(tasks)
  fs.writeFileSync('data.json', tasksJson);

}

main().catch(console.error)
