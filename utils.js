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
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist, create it with empty data
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
    return `${task.description}${task.project ? ` [${task.project}]` : ''}`;
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
      return pc.magenta(`${baseLabel} - Available in ${formatTimeInterval(timeToWait)}`);
    }
    return pc.cyan(`${baseLabel} - Available in ${formatTimeInterval(timeToWait)}`);
  } else if (timeSinceReady >= task.repeatInterval) {
    // Overdue (past one repeat interval)
    return pc.red(baseLabel);
  } else if (percentSinceReady >= 60) {
    // Almost overdue (60% or more past ready time)
    return pc.yellow(baseLabel);
  }
  
  return baseLabel;
}

export function calculateTaskTimingStatus(task, now) {
  const readyTime = task.createdAt + task.repeatInterval;
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