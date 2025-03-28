import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const APP_TITLE = "Marmot";
export const DATA_FILE = join(__dirname, 'data.json');
export const SETTINGS_FILE = join(__dirname, 'settings.json');
export const DEFAULT_REPEAT_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const TASK_STATUS = {
  READY: "ready",
  COMPLETED: "completed",
  ABORTED: "aborted"
};

export const ACTION_TYPES = {
  BACK: "Back",
  COMPLETE_REP: "Complete Rep",
  COMPLETE_TASK: "Complete Task",
  ABORT_TASK: "Abort Rep",
  EDIT_TASK: "Edit Task",
  ADD_TASK: "Add Task",
  SELECT_TASK: "Select Task",
  TOGGLE_WAITING: "Toggle Waiting Tasks",
  FILTER_PROJECT: "Filter by Project",
  SHOW_HISTORY: "Show History",
  EXIT: "Exit",
  SETTINGS: "Settings",
  TOGGLE_DETAILED_INFO: "Toggle Detailed Info"
}; 