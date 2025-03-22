
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

export function optionsFromTasks(tasks) {
  return tasks.map(task => {
    return {
      value: task,
      label: task.description
    }
  });
}

export async function completeRepHandler(tasks, actionInfo) {
  const confirm = await p.confirm({
    message: "Complete rep?"
  })

  if (confirm) {
    const nextRep = makeNextRep(currentTask);
    tasks.push(nextRep);

    Object.assign(currentTask, {
      status: "completed",
      completedAt: (new Date()).getTime()
    })

    currentTask = null;
  }

  return tasks;
}

export async function completeTaskHandler(tasks, actionInfo) {
  const confirm = await p.confirm({
    message: "Complete task? (stops repeating)"
  })

  if (confirm) {
    Object.assign(currentTask, {
      status: "completed",
      completedAt: (new Date()).getTime()
    })

    currentTask = null;
  }

  return tasks;
}

export async function abortTaskHandler(tasks, actionInfo) {
  const confirm = await p.confirm({
    message: "Abort rep?"
  })

  const selectedTask = actionInfo.selectedTask;

  if (confirm) {
    currentTask = null;

    Object.assign(selectedTask, {
      status: "aborted",
      completedAt: (new Date()).getTime()
    })

    let i = tasks.indexOf(selectedTask);
    tasks.splice(i, 1, selectedTask);

    // Create next repetition
    const nextRep = makeNextRep(selectedTask);
    tasks.push(nextRep);
  }

  return tasks;
}

export async function addTaskHandler(tasks, actionInfo) {
  console.clear();
  p.intro(marmotTitle);

  const taskTitle = await p.text({
    message: "New task:",
    placeholder: "Enter title"
  })
  tasks.push(createTask({description: taskTitle}))
  
  return tasks;
}

export async function editTaskHandler(tasks, actionInfo) {
  console.log("Task edited!")

  return tasks;
}

export function backHandler(tasks) {
  currentTask = null;
  return tasks
};

export function exitHandler(tasks, actionInfo) {
  return tasks;
}


export function handleTask() {

}

