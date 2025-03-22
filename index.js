import { setTimeout } from 'node:timers/promises';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { v4 as uuidv4 } from 'uuid';
import { handleTask, optionsFromTasks, createTask } from './handlers.js'
import { actionsMenu } from './actionsMenu.js'
import * as fs from 'fs';

const marmotTitle = "[ Marmot ]"

// Global state object
let state = {
  nextID: 0,
  currentTask: null,
  tasks: []
}

async function main() {
  // Initialize or load existing data
  let tasks = [];
  try {
    const data = fs.readFileSync('./data.json', 'utf-8');
    tasks = JSON.parse(data);
    // Set nextID based on existing tasks
    state.nextID = Math.max(...tasks.map(t => t.id), 0) + 1;
  } catch (err) {
    // If file doesn't exist, start with empty tasks
    fs.writeFileSync('data.json', JSON.stringify([]));
  }

  state.tasks = tasks;
  let output = {};

  while (output.action !== "Exit") {
    console.clear();
    p.intro(marmotTitle);

    if (state.currentTask) {
      p.log.message(
        "Current task: " +
        state.currentTask.description +
        " x" + state.currentTask.iteration
      );
    }

    const activeTasks = state.tasks.filter((task) => task.status === "ready");
    output = await actionsMenu(activeTasks, !!state.currentTask)();
    
    if (output && output.handler) {
      state.tasks = await output.handler(state.tasks, {
        selectedTask: state.currentTask,
        menuOutput: output
      });
    }
  }

  // Save state before exit
  const tasksJson = JSON.stringify(state.tasks);
  fs.writeFileSync('data.json', tasksJson);
}

export { state };
main().catch(console.error);
