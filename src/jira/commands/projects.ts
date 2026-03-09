import { Command } from 'commander';
import { getClient } from '../client';
import { out, wrapApiError } from '../output';

export function registerProjects(jira: Command): void {
  jira
    .command('projects')
    .description('列出所有可见项目')
    .action(async () => {
      try {
        const projects = await (getClient() as any).listProjects() as any[];
        out(projects.map((p: any) => ({ key: p.key, name: p.name })));
      } catch (e) {
        wrapApiError(e);
      }
    });
}
