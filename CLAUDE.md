# @kmfe/devflow — 开发指南

面向 AI Agent 的开发者工具链 CLI，将内部系统（JIRA、GitLab 等）封装为结构化 JSON 命令。

## 常用命令

```bash
pnpm build        # 构建（输出到 dist/）
pnpm dev          # 监听模式构建
pnpm typecheck    # 类型检查
pnpm publish      # 发布到 npm（自动触发 typecheck + build）
```

本地调试：
```bash
node dist/index.mjs -V          # 验证版本号
node dist/index.mjs jira whoami # 验证鉴权
```

## 项目结构

```
src/
  index.ts                  # 入口，注册子命令
  jira/
    index.ts                # jira 子命令聚合，注册所有 jira 命令
    client.ts               # JiraClient 懒初始化
    config.ts               # 配置读写，~/.config/devflow/
    output.ts               # out() / fail() / wrapApiError() 三个输出工具
    commands/
      auth.ts               # 交互式鉴权（唯一允许交互的命令）
      whoami.ts             # 返回当前登录用户
      team.ts               # team-members / team-add / team-remove
      search.ts             # JQL 搜索
      issue.ts              # 工单详情
      issue-ops.ts          # create / update / comment / delete / create-fields
      transitions.ts        # transitions / transition
      worklog.ts            # worklog-get / worklog-add / worklog-delete / time-set
      projects.ts           # 项目列表
      users.ts              # 用户搜索
      permissions.ts        # 权限查询
skills/
  jira/SKILL.md             # Claude Code skill 定义（随源码分发）
docs/
  prd.md                    # 产品需求文档
```

## 核心设计原则

**CLI 的主要调用方是 AI Agent（Claude Code skill）**，因此：

- **stdout**：所有命令输出 `JSON.stringify(data, null, 2)`
- **stderr**：错误输出 `{"error": "...", "code": "<类型>"}` + `exit 1`
- **无交互**：除 `kdev jira auth` 外，所有命令不产生任何交互式提示
- **原子化**：命令语义单一，业务编排由 skill 层负责

## 输出约定

```typescript
import { out, fail, wrapApiError } from '../output';

out(data);              // 正常输出，exit 0
fail('message', 'code') // 错误输出到 stderr，exit 1
wrapApiError(e)         // API 异常自动映射 error code
```

错误 code 类型：`config` / `auth` / `not_found` / `permission` / `network` / `validation`

## 配置文件

```
~/.config/devflow/
  config.json   # { host, token }
  team.json     # { me: "username", team: [{username, displayName}] }
```

`me` 字段在 `kdev jira auth` 成功后自动写入，无需手动设置。

## 构建说明

使用 `tsdown`（基于 rolldown）：
- `moduleResolution: "bundler"`，import 不带 `.js` 后缀
- `minify: true`，构建产物压缩
- shebang 通过 `outputOptions.postBanner` 注入（必须用 postBanner，不能用 banner，minify 会把 banner 剥离）
- 依赖项（commander、jira-client）不打包进 dist，由 npm install 处理

## 扩展新子系统

1. 创建 `src/<name>/` 目录，参照 `src/jira/` 结构
2. 在 `src/index.ts` 注册新子命令
3. 在 `skills/<name>/SKILL.md` 编写对应 skill

## Skill 分发

Skill 文件在源码仓库中，通过 `npx skills add` 安装：

```bash
npx skills add SeeMusic/devflow -g -y --skills '*' -a claude-code
```

skill 改动需手动同步到 `~/.claude/skills/devflow-jira/SKILL.md`（本地测试用）。

## 版本发布

版本号规范：`0.x.0-beta.N`（测试）→ `0.x.0`（正式）

```bash
# 修改 package.json 版本号后
pnpm publish   # 自动触发 prepublishOnly: typecheck + build
```
