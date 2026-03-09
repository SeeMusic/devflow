import { Command } from 'commander';
import { loadTeamConfig, saveTeamConfig } from '../config';
import { getClient } from '../client';
import { out, fail, wrapApiError } from '../output';

export function registerTeamMembers(jira: Command): void {
  jira
    .command('team-members')
    .description('返回团队成员列表')
    .action(() => {
      const team = loadTeamConfig();
      out(team.team ?? []);
    });
}

export function registerTeamAdd(jira: Command): void {
  jira
    .command('team-add <username>')
    .description('向团队成员列表追加成员')
    .action(async (username: string) => {
      const team = loadTeamConfig();
      if (team.team.some(m => m.username === username)) {
        fail(`成员 ${username} 已存在`, 'validation');
      }
      try {
        const users = await (getClient() as any).searchUsers({ username, maxResults: 1 }) as any[];
        const found = users[0];
        if (!found) fail(`未找到用户 ${username}`, 'not_found');
        team.team.push({ username: found.name, displayName: found.displayName });
        saveTeamConfig(team);
        out({ success: true, added: { username: found.name, displayName: found.displayName } });
      } catch (e) {
        wrapApiError(e);
      }
    });
}

export function registerTeamRemove(jira: Command): void {
  jira
    .command('team-remove <username>')
    .description('从团队成员列表移除成员')
    .action((username: string) => {
      const team = loadTeamConfig();
      const before = team.team.length;
      team.team = team.team.filter(m => m.username !== username);
      if (team.team.length === before) {
        fail(`成员 ${username} 不存在`, 'not_found');
      }
      saveTeamConfig(team);
      out({ success: true, removed: username });
    });
}
