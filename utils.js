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
  const hours = Math.floor(milliseconds / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

export function formatTaskLabel(task) {
  if (!task) return '';
  const now = getCurrentTimestamp();
  
  // First iterations are shown immediately and are never waiting
  if (task.iteration === 0) {
    return `${task.description}${task.project ? ` [${task.project}]` : ''}`;
  }
  
  // For subsequent iterations, check if enough time has passed since creation
  const readyTime = task.createdAt + task.repeatInterval;
  const timeSinceReady = now - readyTime;
  
  // Calculate percentages of the repeat interval
  const percentSinceReady = (timeSinceReady / task.repeatInterval) * 100;
  const percentToReady = ((readyTime - now) / task.repeatInterval) * 100;
  
  const baseLabel = `${task.description}${task.project ? ` [${task.project}]` : ''}`;
  
  if (readyTime > now) {
    // Task is waiting
    const timeToWait = readyTime - now;
    if (percentToReady <= 10) {
      // Almost ready (within 10% of ready time)
      return pc.magenta(`${baseLabel} - Available in ${formatTimeInterval(timeToWait)}`);
    }
    return pc.cyan(`${baseLabel} - Available in ${formatTimeInterval(timeToWait)}`);
  } else if (percentSinceReady >= 60) {
    // Almost overdue (60% or more past ready time)
    return pc.yellow(baseLabel);
  }
  
  return baseLabel;
} 