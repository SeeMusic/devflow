# TODO

## 使用体验

- [ ] **P1** 本地缓存系统：对高频前置查询结果做本地缓存（含 TTL），减少重复 API 调用和 AI 的多步骤开销；优先缓存：`whoami`、各项目的状态流转配置（`transitions`）、项目列表（`projects`）
- [ ] **P1** 日报 skill：内置日报格式模板，基于 `updated >= startOfDay()` 查询结果生成结构化日报
- [ ] **P2** 输出规范化：让 AI 自己跑各接口拿真实返回，自主判断哪些字段对下游任务无价值（如 avatar URL、嵌套 meta）、哪些需要转换（如 ADF description → 纯文本），再统一实施裁剪；格式保持 JSON
- [ ] **P2** GitLab 子系统：MR 查询、创建、评论等，参照 jira 模块结构扩展

## 开发体验

- [ ] **P1** 添加 `/devflow-deploy` skill：检查改动、bump 版本、commit、push，提示手动 publish
- [ ] **P1** 添加 `/devflow-install` skill：`npm install -g` 指定版本 + `kdev jira skills add -a <agent>` 更新 skill
- [ ] **P2** 完成上述 skill 后，精简 CLAUDE.md，只保留项目结构和设计约束
