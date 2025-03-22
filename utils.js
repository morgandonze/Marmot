import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { DATA_FILE } from './constants.js';

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

export function formatTaskLabel(task) {
  if (!task) return '';
  return `${task.description} (x${task.iteration})`;
} 