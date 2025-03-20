import { setTimeout } from 'node:timers/promises';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { v4 as uuidv4 } from 'uuid';

import * as fs from 'fs';

let nextID = 0;
const marmotTitle = "[ Marmot ]"

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
    tasks.splice(selectedTask.index, 1, selectedTask);
    Object.assign(selectedTask, {
      status: "completed",
      completedAt: (new Date()).getTime()
    })

    // Create next repetition
    const nextRep = makeNextRep(selectedTask)
    tasks.push(nextRep)
  }

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

function backHandler(tasks) { return tasks };

function exitHandler(tasks, actionInfo) {
  return tasks;
}

function getMenuActions(hasSelection) {
  if (hasSelection) {
    return [
      {
        "value": {"action": "Back", "handler": backHandler},
        "label": "Back"
      },
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
        "label": "Abort Task"
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
  } else {
    return [
      {
        "value": {"action": "Add Task", "handler": addTaskHandler},
        "label": "Add Task"
      },
      {
        "value": {"action": "Exit", "handler": exitHandler},
        "label": "Exit"
      }
    ]
  }

}

function taskList(tasks) {
  return () => p.select({
    message: "Tasks:",
    initialValue: tasks[0].value,
    options: tasks
  })
}

function actionsMenu(selectedTask) {
  const hasSelectedTask = !!selectedTask;

  const message = hasSelectedTask ?
    "Task: [" + selectedTask.description + "; status: " + selectedTask.status + "; iteration: "+ selectedTask.iteration + " ]" :
    "Choose an action (no tasks yet!)"

  const menuActions = getMenuActions(hasSelectedTask)

  return () => p.select({
    message: message,
    initialValue: menuActions[0].value,
    options: menuActions
  })
}

async function main() {
  const data = fs.readFileSync('./newData.json', 'utf-8');
  let tasks = JSON.parse(data);
  let activeTasks, taskOptions;
  let selectedTask, menuOutput = {};

  while(menuOutput.action != "Exit") {
    activeTasks = tasks.filter((task) => (task.status == "ready"))
    taskOptions = optionsFromTasks(activeTasks);
    selectedTask = null;

    if (taskOptions.length) {
      console.clear();
      p.intro(marmotTitle)
      selectedTask = await taskList(taskOptions)();
    }
  
    console.clear();
    p.intro(marmotTitle)
    menuOutput = await actionsMenu(selectedTask)();
    tasks = await menuOutput.handler(tasks, {"selectedTask": selectedTask, "menuOutput": menuOutput});
  }

  const tasksJson = JSON.stringify(tasks)
  fs.writeFileSync('newData.json', tasksJson);

}

main().catch(console.error)
