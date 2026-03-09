import { Command } from 'commander';
import { getClient } from '../client';
import { loadConfig } from '../config';
import { out, fail, wrapApiError } from '../output';

export function registerCreateFields(jira: Command): void {
  jira
    .command('create-fields <projectKey> [issueType]')
    .description('查询创建工单所需字段及必填项')
    .action(async (projectKey: string, issueType?: string) => {
      try {
        const meta = await (getClient() as any).getIssueCreateMetadata({
          projectKeys: projectKey,
          expand: 'projects.issuetypes.fields',
        }) as any;
        const project = meta.projects[0];
        if (!project) fail(`未找到项目 ${projectKey}`, 'not_found');
        const types = issueType
          ? project.issuetypes.filter((t: any) => t.name.includes(issueType))
          : project.issuetypes;
        out(types.map((type: any) => ({
          type: type.name,
          fields: Object.entries(type.fields).map(([key, field]: [string, any]) => ({
            key,
            name: field.name,
            required: field.required,
            type: field.schema?.type,
            allowedValues: field.allowedValues?.slice(0, 10).map((v: any) => v.name ?? v.value),
          })),
        })));
      } catch (e) {
        wrapApiError(e);
      }
    });
}

export function registerCreate(jira: Command): void {
  jira
    .command('create <json>')
    .description('创建工单，返回工单号和链接')
    .action(async (jsonStr: string) => {
      let fields: Record<string, unknown>;
      try {
        fields = JSON.parse(jsonStr);
      } catch {
        fail('JSON 格式错误', 'validation');
      }
      try {
        const result = await (getClient() as any).addNewIssue({ fields }) as any;
        const config = loadConfig();
        out({ key: result.key, url: `https://${config.host}/browse/${result.key}` });
      } catch (e) {
        wrapApiError(e, 'validation');
      }
    });
}

export function registerUpdate(jira: Command): void {
  jira
    .command('update <key> <json>')
    .description('更新工单字段')
    .action(async (key: string, jsonStr: string) => {
      let fields: Record<string, unknown>;
      try {
        fields = JSON.parse(jsonStr);
      } catch {
        fail('JSON 格式错误', 'validation');
      }
      try {
        await (getClient() as any).updateIssue(key, { fields });
        out({ success: true });
      } catch (e) {
        wrapApiError(e, 'validation');
      }
    });
}

export function registerComment(jira: Command): void {
  jira
    .command('comment <key> <body>')
    .description('给工单添加评论')
    .action(async (key: string, body: string) => {
      try {
        await (getClient() as any).addComment(key, body);
        out({ success: true });
      } catch (e) {
        wrapApiError(e);
      }
    });
}

export function registerDelete(jira: Command): void {
  jira
    .command('delete <key>')
    .description('删除工单（永久移除，内部先检查权限）')
    .action(async (key: string) => {
      try {
        const result = await (getClient() as any).genericGet(`mypermissions?issueKey=${key}`) as any;
        if (!result.permissions?.DELETE_ISSUES?.havePermission) {
          fail(`当前用户无权删除 ${key}`, 'permission');
        }
        await (getClient() as any).deleteIssue(key);
        out({ success: true, deleted: key });
      } catch (e) {
        wrapApiError(e);
      }
    });
}
