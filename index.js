import { setTimeout } from 'node:timers/promises';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { v4 as uuidv4 } from 'uuid';
import { handleTask, optionsFromTasks, createTask } from './handlers.js'
import { actionsMenu } from './actionsMenu.js'
import * as fs from 'fs';

const marmotTitle = "[ Marmot ]"

let state = {
  nextID: 0,
  currentTask: null,
  tasks: []
}

async function main() {
  const data = fs.readFileSync('./data.json', 'utf-8');
  let tasks = JSON.parse(data);
  let activeTasks, taskOptions;
  let selectedTask;
  let output = {};

  while(output.action != "Exit") {
    console.clear();
    p.intro(marmotTitle);

    if (state.currentTask) {
      p.log.message(
        "Current task: " +
        currentTask.description +
        " x" + currentTask.iteration
      );
    };

    activeTasks = tasks.filter((task) => task.status == "ready");
    output = await actionsMenu(activeTasks, !!state.currentTask)();
    console.log(output)
    tasks = await output.handler(state.tasks, {"selectedTask": state.currentTask, "menuOutput": output});
  }

  const tasksJson = JSON.stringify(tasks);
  fs.writeFileSync('data.json', tasksJson);
};

main().catch(console.error);
