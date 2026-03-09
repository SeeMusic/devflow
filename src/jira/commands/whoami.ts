import { Command } from 'commander';
import { getClient } from '../client';
import { out, wrapApiError } from '../output';

export function registerWhoami(jira: Command): void {
  jira
    .command('whoami')
    .description('返回当前登录用户信息')
    .action(async () => {
      try {
        const user = await (getClient() as any).genericGet('myself') as any;
        out({ username: user.name, displayName: user.displayName, email: user.emailAddress });
      } catch (e) {
        wrapApiError(e);
      }
    });
}
