/**
 * System introspection utilities for How-CLI
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';

export function getInstalledTools(): string {
  const toolsToCheck = [
    'git', 'npm', 'node', 'python', 'docker', 'pip',
    'go', 'rustc', 'cargo', 'java', 'mvn', 'gradle'
  ];

  const installedTools: string[] = [];

  for (const tool of toolsToCheck) {
    try {
      // Use 'which' on Unix-like systems
      const command = os.platform() === 'win32' ? 'where' : 'which';
      execSync(`${command} ${tool}`, { stdio: 'ignore' });
      installedTools.push(tool);
    } catch {
      // Tool not found, skip it
    }
  }

  return installedTools.join(', ');
}

export function getCurrentTerminal(): string {
  try {
    // Try to get terminal from environment
    if (process.env.TERM_PROGRAM) {
      return process.env.TERM_PROGRAM;
    }

    // Try to get shell name
    if (process.env.SHELL) {
      const shell = process.env.SHELL.split('/').pop();
      if (shell) {
        return shell;
      }
    }

    // Fallback: try to get parent process name on Unix-like systems
    if (os.platform() !== 'win32') {
      try {
        const ppid = process.ppid;
        const result = execSync(`ps -p ${ppid} -o comm=`, { encoding: 'utf-8' }).trim();
        return result;
      } catch {
        // Ignore error
      }
    }

    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

export function getFilesList(directory: string, maxFiles: number = 20): string {
  try {
    const files = fs.readdirSync(directory);
    if (files.length > maxFiles) {
      return files.slice(0, maxFiles).join(', ') + '...';
    }
    return files.join(', ');
  } catch {
    return 'Error listing files';
  }
}

export function isGitRepository(directory: string): boolean {
  try {
    const gitPath = `${directory}/.git`;
    return fs.existsSync(gitPath);
  } catch {
    return false;
  }
}
