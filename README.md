# @kmfe/devflow

**Agent-first 开发者工具链 CLI**

将内部系统（JIRA、GitLab 等）封装为结构化 JSON 命令，供 Claude Code skill 调用。

---

## 安装

### 1. 安装 CLI

```bash
npm install -g @kmfe/devflow
# 或
pnpm add -g @kmfe/devflow
```

安装后可使用 `kdev` 命令。

### 2. 安装 Claude Code Skill（可选）

Skill 文件随源码仓库分发，通过 [vercel-labs/skills](https://github.com/vercel-labs/skills) 安装：

```bash
# SSH
npx skills add git@gitlab.kanjian.com:fe/devflow-cli.git

# HTTPS
npx skills add https://gitlab.kanjian.com/fe/devflow-cli.git
```

> 鉴权沿用本机 git 配置，SSH / HTTPS 均可，按个人习惯选择。

### 3. 配置鉴权

```bash
kdev jira auth
```

---

## 快速开始

```bash
# 验证当前用户
kdev jira whoami

# 搜索我的工单
kdev jira search "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC"
```

---

## 设计原则

CLI 的主要调用方是 **AI agent（Claude Code）**，通过 skill 机制驱动：

- **stdout**：所有命令输出 JSON（`JSON.stringify(data, null, 2)`）
- **stderr**：错误输出 `{"error": "...", "code": "<类型>"}` + `exit 1`
- **无交互**：除 `kdev jira auth` 外，所有命令不产生任何交互式提示
- **原子化**：命令语义单一，业务编排由 skill 层负责

---

## jira 子命令

### 鉴权与上下文

| 命令 | 说明 |
|---|---|
| `kdev jira auth` | 交互式配置，验证后保存至 `~/.config/devflow/` |
| `kdev jira whoami` | 返回当前登录用户信息 |
| `kdev jira me` | 返回 `team.json` 中的 `me` 字段 |
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
| `kdev jira delete <key>` | 删除工单（内部先检查权限） |

### 工时

| 命令 | 说明 |
|---|---|
| `kdev jira worklog-get <key>` | 查看工时记录（返回含 worklog id） |
| `kdev jira worklog-add <key> <duration> [date]` | 记录用时，时长如 `1d`、`2h 30m`，日期默认今天 |
| `kdev jira worklog-delete <key> <worklogId>` | 删除工时记录 |
| `kdev jira time-set <key> <estimate> [remaining]` | 设置预估/剩余时间 |

---

## 配置文件

配置存储在 `~/.config/devflow/`，**不存放在 skill 目录**。

```
~/.config/devflow/
  config.json   # host + token
  team.json     # me + team 成员
```

---

## 错误码

| code | 含义 |
|---|---|
| `config` | 配置文件缺失或格式错误 |
| `auth` | token 无效或鉴权失败 |
| `not_found` | 工单/项目/用户不存在 |
| `permission` | 无操作权限 |
| `network` | 网络或连接错误 |
| `validation` | 参数格式错误 |

---

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 监听模式
pnpm dev

# 类型检查
pnpm typecheck
```

本地调试不安装到全局时，可以直接用：

```bash
node dist/index.js jira whoami
```

---

## 文档

- [PRD](docs/prd.md) — 产品需求文档

---

## 扩展

新增子系统（如 GitLab）：

1. 创建 `src/gitlab/` 目录及命令文件
2. 在 `src/index.ts` 注册新的子命令

现有模块不受影响。
