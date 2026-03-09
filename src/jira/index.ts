import { Command } from 'commander';
import { registerAuth } from './commands/auth';
import { registerSkills } from './commands/skills';
import { registerWhoami } from './commands/whoami';
import { registerTeamMembers, registerTeamAdd, registerTeamRemove } from './commands/team';
import { registerProjects } from './commands/projects';
import { registerIssue } from './commands/issue';
import { registerSearch } from './commands/search';
import { registerUsers } from './commands/users';
import { registerPermissions } from './commands/permissions';
import { registerTransitions, registerTransition } from './commands/transitions';
import {
  registerCreateFields,
  registerCreate,
  registerUpdate,
  registerComment,
  registerDelete,
} from './commands/issue-ops';
import { registerWorklogGet, registerWorklogAdd, registerWorklogDelete, registerTimeSet } from './commands/worklog';

export function createJiraCommand(): Command {
  const jira = new Command('jira').description('JIRA 工单操作');

  // 鉴权
  registerAuth(jira);
  registerWhoami(jira);
  registerSkills(jira);

  // 上下文
  registerTeamMembers(jira);
  registerTeamAdd(jira);
  registerTeamRemove(jira);

  // 查询
  registerProjects(jira);
  registerIssue(jira);
  registerSearch(jira);
  registerUsers(jira);
  registerPermissions(jira);

  // 状态流转
  registerTransitions(jira);
  registerTransition(jira);

  // 工单操作
  registerCreateFields(jira);
  registerCreate(jira);
  registerUpdate(jira);
  registerComment(jira);
  registerDelete(jira);

  // 工时
  registerWorklogGet(jira);
  registerWorklogAdd(jira);
  registerWorklogDelete(jira);
  registerTimeSet(jira);

  return jira;
}
