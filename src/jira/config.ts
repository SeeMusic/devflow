import os from 'os';
import path from 'path';
import fs from 'fs';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'devflow');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const TEAM_PATH = path.join(CONFIG_DIR, 'team.json');

export interface Config {
  host: string;
  token: string;
}

export interface TeamMember {
  username: string;
  displayName: string;
}

export interface TeamConfig {
  me: string;
  team: TeamMember[];
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function getTeamPath(): string {
  return TEAM_PATH;
}

export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    process.stderr.write(JSON.stringify({ error: '请先运行: kdev jira auth', code: 'config' }) + '\n');
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as Config;
  } catch {
    process.stderr.write(JSON.stringify({ error: '配置文件格式错误，请重新运行: kdev jira auth', code: 'config' }) + '\n');
    process.exit(1);
  }
}

export function loadTeamConfig(): TeamConfig {
  if (!fs.existsSync(TEAM_PATH)) {
    return { me: '', team: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(TEAM_PATH, 'utf8')) as TeamConfig;
  } catch {
    return { me: '', team: [] };
  }
}

export function saveConfig(config: Config): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function saveTeamConfig(team: TeamConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(TEAM_PATH, JSON.stringify(team, null, 2));
}
