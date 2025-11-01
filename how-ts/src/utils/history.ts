/**
 * History logging utilities for How-CLI
 */

import * as fs from 'fs';
import * as path from 'path';
import { CONFIG_DIR, HISTORY_FILE } from '../config';

export function logHistory(question: string, commands: string[]): void {
  try {
    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logEntry = `[${timestamp}] Q: ${question}\nCommands:\n${commands.join('\n')}\n\n`;

    fs.appendFileSync(HISTORY_FILE, logEntry, 'utf-8');
  } catch (error) {
    // Log warning but don't fail the operation
    console.warn(`Failed to write history: ${error instanceof Error ? error.message : error}`);
  }
}

export function showHistory(): void {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
      console.log(content);
    } catch (error) {
      console.error(`Error reading history file: ${error instanceof Error ? error.message : error}`);
    }
  } else {
    console.log('No history found.');
  }
}
