import { Command } from 'commander';
import { getClient } from '../client';
import { out, fail, wrapApiError } from '../output';

export function registerIssue(jira: Command): void {
  jira
    .command('issue <key>')
    .description('查看工单详情（含子任务、父任务）')
    .action(async (key: string) => {
      try {
        const issue = await (getClient() as any).getIssue(key) as any;
        const f = issue.fields;
        out({
          key: issue.key,
          summary: f.summary,
          type: f.issuetype?.name,
          status: f.status?.name,
          priority: f.priority?.name,
          assignee: f.assignee ? { name: f.assignee.displayName, username: f.assignee.name } : null,
          reporter: f.reporter ? { name: f.reporter.displayName, username: f.reporter.name } : null,
          description: f.description,
          duedate: f.duedate,
          created: f.created,
          updated: f.updated,
          parent: f.parent ? { key: f.parent.key, summary: f.parent.fields?.summary } : null,
          subtasks: f.subtasks?.map((s: any) => ({
            key: s.key,
            summary: s.fields.summary,
            status: s.fields.status?.name,
          })) ?? [],
        });
      } catch (e) {
        if (e instanceof Error && e.message.includes('404')) {
          fail(`工单 ${key} 不存在`, 'not_found');
        }
        wrapApiError(e);
      }
    });
}
