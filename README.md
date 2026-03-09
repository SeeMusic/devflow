# @kmfe/devflow

**Agent-first 开发者工具链 CLI**

将内部系统（JIRA 等）封装为结构化命令，配合 Claude Code skill 使用，通过自然语言驱动日常开发工作流。

---

## 安装

### 1. 安装 CLI

```bash
npm install -g @kmfe/devflow
```

### 2. 安装 Skill

```bash
# Claude Code
kdev jira skills add -a claude-code

# Codex
kdev jira skills add -a codex

# 同时安装到多个客户端
kdev jira skills add -a claude-code -a codex
```

> 其他 AI 客户端的 agent 名称见 [vercel-labs/skills 官方文档](https://github.com/vercel-labs/skills?tab=readme-ov-file#available-agents)。

### 3. 配置鉴权（必须手动执行）

```bash
kdev jira auth
```

> 鉴权信息（JIRA host 和个人令牌）存储在本机 `~/.config/devflow/`，不经过 AI，需在终端手动执行一次。

---

## 使用

安装完成后，直接在 Claude Code 中用自然语言操作：

```
查看我今天的工单
在前端组创建一个任务，分配给我，标题是"优化登录流程"
把 FE-123 的状态改为进行中
给 FE-456 记录 2 小时工时
```

---

## JIRA 命令参考

> 以下命令由 skill 自动调用，通常不需要手动执行。

### 鉴权与上下文

| 命令 | 说明 |
|---|---|
| `kdev jira auth` | 交互式配置，验证后保存至 `~/.config/devflow/` |
| `kdev jira whoami` | 返回当前登录用户信息 |
| `kdev jira team-members` | 返回团队成员列表 |
| `kdev jira team-add <username>` | 追加成员 |
| `kdev jira team-remove <username>` | 移除成员 |

### 查询

| 命令 | 说明 |
|---|---|
| `kdev jira projects` | 列出所有可见项目 |
| `kdev jira issue <key>` | 工单详情（含子任务、父任务） |
| `kdev jira search <jql> [--max <n>]` | JQL 搜索，默认 50，上限 200 |
| `kdev jira users <query>` | 按姓名搜索用户 |
| `kdev jira permissions <key>` | 查询当前用户对工单的操作权限 |

### 工单操作

| 命令 | 说明 |
|---|---|
| `kdev jira transitions <key>` | 列出可用状态流转，返回 `[{id, name}]` |
| `kdev jira transition <key> <transitionId>` | 按 ID 执行流转 |
| `kdev jira create-fields <projectKey> [issueType]` | 查询创建所需字段 |
| `kdev jira create <json>` | 创建工单 |
| `kdev jira update <key> <json>` | 更新工单字段 |
| `kdev jira comment <key> <内容>` | 添加评论 |
| `kdev jira delete <key>` | 删除工单 |

### 工时

| 命令 | 说明 |
|---|---|
| `kdev jira worklog-get <key>` | 查看工时记录 |
| `kdev jira worklog-add <key> <duration> [date]` | 记录用时，时长如 `1d`、`2h 30m`，日期默认今天 |
| `kdev jira worklog-delete <key> <worklogId>` | 删除工时记录 |
| `kdev jira time-set <key> <estimate> [remaining]` | 设置预估/剩余时间 |
