import { Command } from 'commander';
import { getClient } from '../client';
import { out, wrapApiError } from '../output';

export function registerUsers(jira: Command): void {
  jira
    .command('users <query>')
    .description('按姓名搜索用户')
    .action(async (query: string) => {
      try {
        const users = await (getClient() as any).searchUsers({ username: query, maxResults: 10 }) as any[];
        out(users.map((u: any) => ({
          name: u.displayName,
          username: u.name,
          email: u.emailAddress,
        })));
      } catch (e) {
        wrapApiError(e);
      }
    });
}
