import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import pc from 'picocolors';
import { DATA_FILE } from './constants.js';
import { state } from './index.js';

export function getCurrentTimestamp() {
  return new Date().getTime();
}

export function saveData(data) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(DATA_FILE, jsonData);
}

export function loadData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsedData = JSON.parse(data);
    // Ensure we return an array even if the file contains invalid data
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (err) {
    // If file doesn't exist or contains invalid JSON, create it with empty data
    saveData([]);
    return [];
  }
}

export function findTaskById(tasks, uuid) {
  return tasks.findIndex(t => t.uuid === uuid);
}

export function generateId() {
  return uuidv4();
}

export function formatTimeInterval(milliseconds) {
  const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
  const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  
  return parts.join(' ') || '0s';
}

export function formatTaskLabel(task) {
  if (!task) return '';
  const now = getCurrentTimestamp();
  
  // First iterations are shown immediately and are never waiting
  if (task.iteration === 0) {
    const baseLabel = `${task.description}${task.project ? ` [${task.project}]` : ''}`;
    if (!state.showDetailedInfo) return baseLabel;
    
    const { readyTime, timeSinceReady, timeToReady, percentSinceReady } = calculateTaskTimingStatus(task, now);
    const sequenceTasks = state.tasks.filter(t => t.sequenceId === task.sequenceId);
    const completedTasks = sequenceTasks.filter(t => !t.inProgress && t.successful !== false).length;
    const nonPendingTasks = sequenceTasks.filter(t => !t.inProgress).length;
    const completionPercentage = nonPendingTasks > 0 
      ? (completedTasks / nonPendingTasks * 100).toFixed(1)
      : "0.0";
    
    const details = [];
    const dueTime = readyTime + task.repeatInterval;
    const timeToDue = dueTime - now;
    if (timeToDue > 0) {
      details.push(`Due in ${formatTimeInterval(timeToDue)}`);
    } else {
      details.push(`Overdue by ${formatTimeInterval(-timeToDue)}`);
    }
    details.push(pc.yellowBright(`${completionPercentage}%`));
    
    return `${baseLabel} | ${details.join(' | ')}`;
  }
  
  const baseLabel = `${task.description}${task.project ? ` [${task.project}]` : ''}`;
  
  if (!task.inProgress) {
    if (task.successful === true) {
      return pc.green(baseLabel);
    } else if (task.successful === false) {
      return pc.red(baseLabel);
    } else {
      return pc.yellow(baseLabel);
    }
  }
  
  const { readyTime, timeSinceReady, timeToReady, percentToReady, percentSinceReady } = calculateTaskTimingStatus(task, now);
  
  if (readyTime > now) {
    // Task is waiting
    const timeToWait = readyTime - now;
    if (percentToReady <= 10) {
      // Almost ready (within 10% of ready time)
      const base = pc.magenta(baseLabel);
      if (!state.showDetailedInfo) return base;
      
      const sequenceTasks = state.tasks.filter(t => t.sequenceId === task.sequenceId);
      const completedTasks = sequenceTasks.filter(t => !t.inProgress && t.successful !== false).length;
      const nonPendingTasks = sequenceTasks.filter(t => !t.inProgress).length;
      const completionPercentage = nonPendingTasks > 0 
        ? (completedTasks / nonPendingTasks * 100).toFixed(1)
        : "0.0";
      
      const details = [];
      details.push(`Ready in ${formatTimeInterval(timeToWait)}`);
      const dueTime = readyTime + task.repeatInterval;
      const timeToDue = dueTime - now;
      details.push(`Due in ${formatTimeInterval(timeToDue)}`);
      details.push(pc.yellowBright(`${completionPercentage}%`));
      
      return `${base} | ${details.join(' | ')}`;
    }
    const base = pc.cyan(baseLabel);
    if (!state.showDetailedInfo) return base;
    
    const sequenceTasks = state.tasks.filter(t => t.sequenceId === task.sequenceId);
    const completedTasks = sequenceTasks.filter(t => !t.inProgress && t.successful !== false).length;
    const nonPendingTasks = sequenceTasks.filter(t => !t.inProgress).length;
    const completionPercentage = nonPendingTasks > 0 
      ? (completedTasks / nonPendingTasks * 100).toFixed(1)
      : "0.0";
    
    const details = [];
    details.push(`Ready in ${formatTimeInterval(timeToWait)}`);
    const dueTime = readyTime + task.repeatInterval;
    const timeToDue = dueTime - now;
    details.push(`Due in ${formatTimeInterval(timeToDue)}`);
    details.push(pc.yellowBright(`${completionPercentage}%`));
    
    return `${base} | ${details.join(' | ')}`;
  } else if (timeSinceReady >= task.repeatInterval) {
    // Overdue (past one repeat interval)
    const base = pc.red(baseLabel);
    if (!state.showDetailedInfo) return base;
    
    const sequenceTasks = state.tasks.filter(t => t.sequenceId === task.sequenceId);
    const completedTasks = sequenceTasks.filter(t => !t.inProgress && t.successful !== false).length;
    const nonPendingTasks = sequenceTasks.filter(t => !t.inProgress).length;
    const completionPercentage = nonPendingTasks > 0 
      ? (completedTasks / nonPendingTasks * 100).toFixed(1)
      : "0.0";
    
    const details = [];
    const dueTime = readyTime + task.repeatInterval;
    const timeToDue = dueTime - now;
    details.push(`Overdue by ${formatTimeInterval(-timeToDue)}`);
    details.push(pc.yellowBright(`${completionPercentage}%`));
    
    return `${base} | ${details.join(' | ')}`;
  } else if (percentSinceReady >= 60) {
    // Almost overdue (60% or more past ready time)
    const base = pc.yellow(baseLabel);
    if (!state.showDetailedInfo) return base;
    
    const sequenceTasks = state.tasks.filter(t => t.sequenceId === task.sequenceId);
    const completedTasks = sequenceTasks.filter(t => !t.inProgress && t.successful !== false).length;
    const nonPendingTasks = sequenceTasks.filter(t => !t.inProgress).length;
    const completionPercentage = nonPendingTasks > 0 
      ? (completedTasks / nonPendingTasks * 100).toFixed(1)
      : "0.0";
    
    const details = [];
    const dueTime = readyTime + task.repeatInterval;
    const timeToDue = dueTime - now;
    details.push(`Due in ${formatTimeInterval(timeToDue)}`);
    details.push(pc.yellowBright(`${completionPercentage}%`));
    
    return `${base} | ${details.join(' | ')}`;
  }
  
  const base = baseLabel;
  if (!state.showDetailedInfo) return base;
  
  const sequenceTasks = state.tasks.filter(t => t.sequenceId === task.sequenceId);
  const completedTasks = sequenceTasks.filter(t => !t.inProgress && t.successful !== false).length;
  const nonPendingTasks = sequenceTasks.filter(t => !t.inProgress).length;
  const completionPercentage = nonPendingTasks > 0 
    ? (completedTasks / nonPendingTasks * 100).toFixed(1)
    : "0.0";

  const details = [];
  const dueTime = readyTime + task.repeatInterval;
  const timeToDue = dueTime - now;
  if (timeToDue > 0) {
    details.push(`Due in ${formatTimeInterval(timeToDue)}`);
  } else {
    details.push(`Overdue by ${formatTimeInterval(-timeToDue)}`);
  }
  details.push(pc.yellowBright(`${completionPercentage}%`));
  
  return `${base} | ${details.join(' | ')}`;
}

export function calculateTaskTimingStatus(task, now) {
  // For iteration 0, ready time is the creation time
  // For other iterations, ready time is creation time + repeat interval
  const readyTime = task.iteration === 0 ? task.createdAt : task.createdAt + task.repeatInterval;
  const timeSinceReady = now - readyTime;
  const timeToReady = readyTime - now;
  const percentSinceReady = (timeSinceReady / task.repeatInterval) * 100;
  const percentToReady = (timeToReady / task.repeatInterval) * 100;

  let status = task.inProgress ? "in progress" : 
                task.successful === true ? "completed (on time)" :
                task.successful === false ? "aborted" : "completed (late)";
  let info = '';

  if (task.inProgress) {
    if (readyTime > now) {
      // Task is waiting
      status = percentToReady <= 10 ? "almost ready" : "waiting";
      info = `Ready in ${formatTimeInterval(timeToReady)}`;
    } else if (timeSinceReady >= task.repeatInterval) {
      status = "overdue";
      info = `Overdue by ${formatTimeInterval(timeSinceReady - task.repeatInterval)}`;
    } else if (percentSinceReady >= 60) {
      status = "almost overdue";
      info = `Due in ${formatTimeInterval(task.repeatInterval - timeSinceReady)}`;
    } else if (timeSinceReady > 0) {
      status = "ready";
      info = `Due in ${formatTimeInterval(task.repeatInterval - timeSinceReady)}`;
    }
  }

  return { status, info, readyTime, timeSinceReady, timeToReady, percentSinceReady, percentToReady };
}

export function getTaskDescriptionColor(task, now) {
  if (!task.inProgress) return pc.white;

  const { readyTime, timeSinceReady, percentSinceReady, percentToReady } = calculateTaskTimingStatus(task, now);

  if (readyTime > now) {
    // Task is waiting
    return percentToReady <= 10 ? pc.magenta : pc.cyan;
  } else if (timeSinceReady >= task.repeatInterval) {
    return pc.red;
  } else if (percentSinceReady >= 60) {
    return pc.yellow;
  }

  return pc.white;
}

export function makeNextRep(previousRep) {
  const now = getCurrentTimestamp();
  return {
    ...previousRep,
    id: state.nextID++,
    uuid: generateId(),
    iteration: previousRep.iteration + 1,
    inProgress: true,
    successful: null,
    createdAt: now,
    completedAt: null,
    sequenceId: previousRep.sequenceId
  };
} 