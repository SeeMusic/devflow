import { Command } from 'commander';
import { getClient } from '../client';
import { out, wrapApiError } from '../output';

export function registerTransitions(jira: Command): void {
  jira
    .command('transitions <key>')
    .description('列出当前可用的状态流转，返回 [{id, name}]')
    .action(async (key: string) => {
      try {
        const result = await (getClient() as any).listTransitions(key) as any;
        out(result.transitions.map((t: any) => ({ id: t.id, name: t.name })));
      } catch (e) {
        wrapApiError(e);
      }
    });
}

export function registerTransition(jira: Command): void {
  jira
    .command('transition <key> <transitionId>')
    .description('按 ID 执行状态流转（ID 从 transitions 命令取得）')
    .action(async (key: string, transitionId: string) => {
      try {
        await (getClient() as any).transitionIssue(key, { transition: { id: transitionId } });
        out({ success: true, key, transitionId });
      } catch (e) {
        wrapApiError(e, 'validation');
      }
    });
}
