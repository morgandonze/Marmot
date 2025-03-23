import fs from 'fs';
import { SETTINGS_FILE } from './constants.js';

const DEFAULT_SETTINGS = {
  showDetailedInfo: false,
  showWaiting: false,
  projectFilter: null
};

export function loadSettings() {
  try {
    const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist or contains invalid JSON, create it with default settings
    saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  const jsonData = JSON.stringify(settings, null, 2);
  fs.writeFileSync(SETTINGS_FILE, jsonData);
} 