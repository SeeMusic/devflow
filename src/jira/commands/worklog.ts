import { Command } from 'commander';
import { getClient } from '../client';
import { out, fail, wrapApiError } from '../output';

// 校验时长格式：支持 w/d/h/m，组合须空格分隔，如 1w、1d、2h 30m、1d 2h 30m
function validateDuration(dur: string): boolean {
  return /^(\d+[wdhm]\s*)+$/.test(dur.trim());
}

// 校验日期格式 YYYY-MM-DD
function validateDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function registerWorklogGet(jira: Command): void {
  jira
    .command('worklog-get <key>')
    .description('查看工单工时记录（预估/实际/剩余）')
    .action(async (key: string) => {
      try {
        const issue = await (getClient() as any).getIssue(key, 'summary,timetracking') as any;
        const worklogs = await (getClient() as any).getIssueWorklogs(key) as any;
        const f = issue.fields;
        out({
          key,
          summary: f.summary,
          timetracking: {
            originalEstimate: f.timetracking?.originalEstimate ?? null,
            remainingEstimate: f.timetracking?.remainingEstimate ?? null,
            timeSpent: f.timetracking?.timeSpent ?? null,
          },
          worklogs: worklogs.worklogs.map((w: any) => ({
            id: w.id,
            author: w.author?.displayName,
            timeSpent: w.timeSpent,
            started: w.started?.slice(0, 10),
            comment: w.comment,
          })),
        });
      } catch (e) {
        wrapApiError(e);
      }
    });
}

export function registerWorklogAdd(jira: Command): void {
  jira
    .command('worklog-add <key> <duration> [date]')
    .description('记录用时（时长如 1h / 2h 30m / 1d，日期默认今天）')
    .action(async (key: string, duration: string, date?: string) => {
      if (!validateDuration(duration)) {
        fail(`时长格式错误："${duration}"，正确格式示例：1h、2h 30m、1d`, 'validation');
      }
      if (date && !validateDate(date)) {
        fail(`日期格式错误："${date}"，正确格式：YYYY-MM-DD`, 'validation');
      }
      const started = date
        ? new Date(date + 'T09:00:00.000+0800').toISOString().replace('Z', '+0800')
        : new Date().toISOString().replace('Z', '+0800');
      try {
        await (getClient() as any).addWorklog(key, { timeSpent: duration, started });
        out({ success: true, key, timeSpent: duration, date: date ?? new Date().toISOString().slice(0, 10) });
      } catch (e) {
        wrapApiError(e);
      }
    });
}

export function registerWorklogDelete(jira: Command): void {
  jira
    .command('worklog-delete <key> <worklogId>')
    .description('删除工时记录（worklogId 从 worklog-get 获取）')
    .action(async (key: string, worklogId: string) => {
      try {
        await (getClient() as any).deleteWorklog(key, worklogId);
        out({ success: true, key, worklogId });
      } catch (e) {
        wrapApiError(e);
      }
    });
}

export function registerTimeSet(jira: Command): void {
  jira
    .command('time-set <key> <estimate> [remaining]')
    .description('设置预估和剩余时间（时长如 1h / 1d 4h）')
    .action(async (key: string, estimate: string, remaining?: string) => {
      if (!validateDuration(estimate)) {
        fail(`预估时长格式错误："${estimate}"，正确格式示例：1h、1d 4h`, 'validation');
      }
      if (remaining && !validateDuration(remaining)) {
        fail(`剩余时长格式错误："${remaining}"，正确格式示例：1h、1d 4h`, 'validation');
      }
      try {
        await (getClient() as any).updateIssue(key, {
          fields: {
            timetracking: {
              originalEstimate: estimate,
              remainingEstimate: remaining ?? estimate,
            },
          },
        });
        out({ success: true, key, originalEstimate: estimate, remainingEstimate: remaining ?? estimate });
      } catch (e) {
        wrapApiError(e);
      }
    });
}
