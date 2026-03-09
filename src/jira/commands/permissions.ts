import { Command } from 'commander';
import { getClient } from '../client';
import { out, wrapApiError } from '../output';

const PERMISSION_KEYS = [
  'DELETE_ISSUES',
  'EDIT_ISSUES',
  'TRANSITION_ISSUES',
  'ASSIGN_ISSUES',
  'ADD_COMMENTS',
  'CREATE_ISSUES',
];

export function registerPermissions(jira: Command): void {
  jira
    .command('permissions <key>')
    .description('查询当前用户对工单的操作权限')
    .action(async (key: string) => {
      try {
        const result = await (getClient() as any).genericGet(`mypermissions?issueKey=${key}`) as any;
        const perms = result.permissions;
        out(Object.fromEntries(
          PERMISSION_KEYS.map(k => [perms[k]?.name ?? k, perms[k]?.havePermission ?? false])
        ));
      } catch (e) {
        wrapApiError(e);
      }
    });
}
