# devflow-cli PRD

## 使用背景

这个 CLI 的主要调用方是 **AI agent（Claude Code）**，通过 skill 机制驱动。用户在对话中说"查我的工单"、"创建一个任务"，skill 理解意图后调用对应 CLI 命令，将 JSON 结果解读为中文回复给用户。

因此 CLI 的设计原则是 **agent-first**：
- 所有命令输出结构化 JSON，供 agent 解析
- 除 `auth` 外无任何交互式提示
- 命令语义原子化，业务编排逻辑留给 skill 层

**skill 负责**：理解用户意图、多步编排、JQL 拼接、结果中文呈现
**CLI 负责**：JIRA API 封装、鉴权管理、本地配置上下文（me/team）、输出裁剪

## 背景

将现有 JIRA skill 脚本提取为独立 npm CLI 包，与 skill 解耦。
支持将来扩展其他内部系统（GitLab、IM 等）。

### 现有实现

- skill 脚本：`~/.claude/skills/jira/jira.js`
- skill 说明：`~/.claude/skills/jira/SKILL.md`
- 现有依赖：`jira-client`（npm 包，直接封装 JIRA REST API）
- JIRA 地址：`jira.kanjian.com`（内网，SSL 证书不严格，需 `strictSSL: false`）
- 鉴权方式：JIRA Personal Access Token（Bearer Token）

---

## 目标

1. CLI 独立安装，skill 只负责调用 CLI 命令
2. 鉴权信息不再存放在 skill 目录，存到 `~/.config/devflow/`
3. 命令结构支持多子系统扩展（`kdev jira <cmd>`、`kdev gitlab <cmd>` 等）

---

## 技术选型

| 项 | 选择 |
|---|---|
| 运行时 | Node.js ≥18（与 Claude Code 安装前提一致，无额外依赖） |
| 命令框架 | `commander` |
| JIRA 客户端 | `jira-client` + `@types/jira-client` |
| 语言 | TypeScript |
| 包管理 | pnpm |
| 打包 | tsdown（试用，备选 tsup） |
| 发布方式 | npm scoped 包 |

**包名与命令名**：

```json
{
  "name": "@kmfe/devflow",
  "bin": { "kdev": "dist/index.js" }
}
```

> 命令名 `kdev` 为暂定，发布前可随时修改。包名 `@kmfe/devflow` 一经发布不易变更。

---

## 项目结构

```
<project-root>/
  src/
    index       # 入口，注册所有子命令
    jira/       # jira 子系统
    gitlab/     # 将来
  skills/
    jira/
      SKILL.md  # 配套 skill 文件，与 CLI 同仓库维护
  package.json
  README.md
```

**扩展模式**：新增子系统创建对应目录，在入口注册即可，现有模块不受影响。

---

## 配置

**配置目录**：`~/.config/devflow/`

**config.json**：
```json
{
  "host": "jira.kanjian.com",
  "token": "<personal-access-token>"
}
```

> 现阶段单 host，无需多 host 结构，保持简单。

**team.json**：
```json
{
  "me": "<username>",
  "team": [
    { "username": "foo", "displayName": "张三" }
  ]
}
```

---

## 鉴权流程

- `kdev jira auth`：**唯一交互式命令**，只能用户在终端手动执行
  1. 打印令牌获取路径：`https://jira.kanjian.com` → 右上角头像 → Profile → Personal Access Tokens
  2. 提示输入 token（`readline`）
  3. 调 `whoami` 验证，成功后写入 `~/.config/devflow/config.json`
  4. 询问是否设置团队成员（可跳过）

- 其他所有命令：执行前检查 config 存在性
  ```
  config 不存在 → exit 1 + stderr: "请先运行: kdev jira auth"
  ```

- **agent 不触发 auth**，收到 exit 1 后转告用户手动执行一次。

---

## jira 子命令清单

### 初始化与上下文

| 命令 | 说明 |
|---|---|
| `jira auth` | 交互式配置，验证后保存 |
| `jira whoami` | 返回当前登录用户信息 |
| `jira me` | 返回 team.json 中的 me 字段；team.json 不存在时返回 `{"error":"...","code":"config"}` |
| `jira team-members` | 返回团队成员列表；team.json 不存在或 team 为空时返回空数组 |
| `jira team-add <username>` | 向 team.json 追加成员 |
| `jira team-remove <username>` | 从 team.json 移除成员 |

> `me` / `team-members` 让 skill 无需感知配置文件路径和格式。
> `team-add` / `team-remove` / `me` 为 V1 可选模块，不阻塞核心链路（auth / 查询 / 工单操作 / 工时）。

### 查询

| 命令 | 参数 | 说明 |
|---|---|---|
| `jira projects` | — | 列出所有可见项目 |
| `jira issue` | `<key>` | 工单详情（含子任务、父任务） |
| `jira search` | `<jql> [--max <n>]` | JQL 搜索，默认 50，上限 200（超出静默截断） |
| `jira users` | `<query>` | 按姓名搜索用户 |
| `jira permissions` | `<key>` | 查询当前用户对工单的权限 |

### 工单操作

| 命令 | 参数 | 说明 |
|---|---|---|
| `jira transitions` | `<key>` | 列出当前可用状态流转，返回 `[{id, name}]` |
| `jira transition` | `<key> <transitionId>` | 按 ID 执行状态流转，ID 从 `transitions` 返回值中取 |
| `jira create-fields` | `<projectKey> [issueType]` | 查询创建所需字段及必填项 |
| `jira create` | `<json>` | 创建工单 |
| `jira update` | `<key> <json>` | 更新工单字段 |
| `jira comment` | `<key> <内容>` | 添加评论 |
| `jira delete` | `<key>` | 删除工单（内部先检查权限） |

### 工时

| 命令 | 参数 | 说明 |
|---|---|---|
| `jira worklog-get` | `<key>` | 查看工时记录（预估/实际/剩余） |
| `jira worklog-add` | `<key> <时长> [日期]` | 记录用时；时长格式 `1m`/`1h`/`1d` 及组合如 `1d 2h 30m`；日期格式 `YYYY-MM-DD`，默认今天 |
| `jira time-set` | `<key> <预估> [剩余]` | 设置预估和剩余时间；时长格式同上 |

> 时长或日期格式不合法时返回 `{"error":"...","code":"validation"}`。

---

## 从 jira.js 移除的命令

以下命令逻辑迁移至 skill 层编排，CLI 不再提供：

| 原命令 | 移除原因 |
|---|---|
| `my-issues` | 固化了 JQL，skill 改用 `search` 自由组合 |
| `team-issues` | 同上，且不同项目组查询需求不同 |
| `team-summary` | 日期逻辑 + 分组由 skill 编排，CLI 提供 `search` + `me` + `team-members` 即可 |
| `close` | 终态关键词跨项目组不通用，skill 调 `transitions` 后自行判断 |

---

## 输出规范

- **stdout**：所有命令输出 JSON（`JSON.stringify(data, null, 2)`）
- **stderr**：错误输出 `{"error": "...", "code": "<错误类型>"}` + `exit 1`
- skill 负责将 JSON 解读后以中文呈现，不直接展示原始 JSON

**错误码分类：**

| code | 含义 |
|---|---|
| `config` | 配置文件缺失或格式错误 |
| `auth` | token 无效或鉴权失败 |
| `not_found` | 工单/项目/用户不存在 |
| `permission` | 无操作权限 |
| `network` | 网络或连接错误 |
| `validation` | 参数格式错误 |

---

## 行为约定

### JSON 入参透传

`create`、`update` 接收的 JSON 直接透传给 JIRA API，CLI 不做字段校验。
格式错误由 JIRA API 返回，CLI 原样包装进 `{"error":"...","code":"validation"}` 输出。

### issue 输出字段

```json
{
  "key": "PROJ-123",
  "summary": "...",
  "type": "任务",
  "status": "进行中",
  "priority": "Medium",
  "assignee": { "name": "张三", "username": "zhangsan" },
  "reporter": { "name": "李四", "username": "lisi" },
  "description": "...",
  "duedate": "2026-03-01",
  "created": "2026-01-01T00:00:00.000+0800",
  "updated": "2026-03-01T00:00:00.000+0800",
  "parent": { "key": "PROJ-100", "summary": "..." },
  "subtasks": [{ "key": "PROJ-124", "summary": "...", "status": "待处理" }]
}
```

### transition 执行规则

CLI 只接受 `transitionId`，不做自然语言匹配。

skill 的标准流程：
1. `jira transitions <key>` 获取 `[{id, name}]` 列表
2. AI 根据用户意图匹配对应 ID（如"待测试" → id: "31"）
3. `jira transition <key> <id>` 执行

歧义场景（跨项目状态名不同、同名多条）由 skill 层向用户确认，CLI 不介入。
传入不合法 ID 时，JIRA API 会返回错误，CLI 包装为 `{"error":"...","code":"validation"}`。

### delete 权限检查

调用 JIRA `mypermissions?issueKey=<key>` API，检查 `DELETE_ISSUES.havePermission` 字段。
为 `false` 时返回 `{"error":"当前用户无权删除 <key>","code":"permission"}`。

---

## 缓存备忘（不进入 V1）

> V1 全部实时调用，保证正确性优先。缓存作为后续优化项。

缓存候选对象（V1.1 考虑）：

| 对象 | 建议 TTL | 缓存文件示例 |
|---|---|---|
| `projects` 列表 | 10-30 分钟 | `~/.config/devflow/cache/projects.json` |
| `create-fields` | 10-30 分钟 | `cache/create-fields-PROJ-任务.json` |
| `transitions` | 30-120 秒 | 不建议长期缓存 |

配套命令（V1.1）：`jira cache clear`、各命令支持 `--no-cache`。
写操作失败时自动重拉配置重试一次，仍失败再报错。

## 职责边界

```
skill（理解意图 + 编排 + 中文呈现）
  ↓ 调用 CLI 命令
CLI（JIRA API 转发 + 本地配置上下文）
  ↓
JIRA REST API（jira.kanjian.com）
```

| 层 | 负责 |
|---|---|
| skill | 用户意图、多步编排、JQL 拼接、结果中文呈现 |
| CLI | API 封装、auth、me/team 配置、输出裁剪 |

---

## skill 分发备忘（不进入 V1）

`skills/<subsystem>/SKILL.md` 与 CLI 源码同仓库维护，随 CLI 一起迭代。

**V1 手动安装**：用户手动复制对应 SKILL.md 到 `~/.claude/skills/<subsystem>/SKILL.md`。

**分发机制待定**（CLI 稳定后处理）：

- 方案 A：`postinstall` 脚本，`npm install -g` 时自动写入 `~/.claude/skills/`
- 方案 B：`kdev install-skill` 命令，用户手动触发，幂等覆盖

两方案不互斥，可 A 做首次安装、B 做手动更新通道。暂不实现，占位记录。

---

## skill 改造备忘

> **不在本 PRD 范围内，不需要执行。** 仅作记录，供日后单独处理。

CLI 完成后，`~/.claude/skills/jira/SKILL.md` 需同步更新：

1. 删除 `npm install` 初始化步骤
2. 调用方式从 `node ~/.claude/skills/jira/jira.js <cmd>` 改为 `kdev jira <cmd>`
3. 删除 `my-issues`、`team-issues`、`team-summary`、`close` 命令描述，改为 skill 层编排逻辑
4. 鉴权部分改为：配置缺失时提示用户手动运行 `kdev jira auth`
