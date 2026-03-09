# TODO

## 开发体验

- [ ] 添加 `/devflow-deploy` skill：检查改动、bump 版本、commit、push，提示手动 publish
- [ ] 添加 `/devflow-install` skill：`npm install -g` 指定版本 + 以下命令拉最新 skill：
  ```bash
  npx skills add git@gitlab.kanjian.com:fe/devflow-cli.git -g -y --skills '*' -a claude-code
  ```
- [ ] 完成上述 skill 后，精简 CLAUDE.md，只保留项目结构和设计约束
