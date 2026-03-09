import { Command } from 'commander';
import { getClient } from '../client';
import { out, wrapApiError } from '../output';

const MAX_RESULTS_LIMIT = 200;
const DEFAULT_MAX_RESULTS = 50;

export function registerSearch(jira: Command): void {
  jira
    .command('search <jql>')
    .description('用 JQL 搜索工单')
    .option('--max <n>', '最多返回条数（默认 50，上限 200）', String(DEFAULT_MAX_RESULTS))
    .action(async (jql: string, options: { max: string }) => {
      try {
        const maxResults = Math.min(parseInt(options.max) || DEFAULT_MAX_RESULTS, MAX_RESULTS_LIMIT);
        const result = await (getClient() as any).searchJira(jql, {
          fields: ['summary', 'status', 'assignee', 'priority', 'issuetype', 'duedate', 'project', 'updated'],
          maxResults,
        }) as any;
        out({
          total: result.total,
          issues: result.issues.map((i: any) => ({
            key: i.key,
            project: i.fields.project?.key,
            type: i.fields.issuetype?.name,
            status: i.fields.status?.name,
            assignee: i.fields.assignee?.displayName ?? null,
            priority: i.fields.priority?.name,
            duedate: i.fields.duedate,
            updated: i.fields.updated,
            summary: i.fields.summary,
          })),
        });
      } catch (e) {
        wrapApiError(e);
      }
    });
}
