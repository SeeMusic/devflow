import { Command } from 'commander';
import readline from 'readline';
import fs from 'fs';
import { resetClient, getClient } from '../client';
import { loadConfig as _loadConfig, loadTeamConfig, saveConfig, saveTeamConfig, getConfigPath } from '../config';
import { out, fail } from '../output';

export function registerAuth(jira: Command): void {
  jira
    .command('auth')
    .description('交互式配置 JIRA 鉴权（仅需运行一次）')
    .action(async () => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stderr });

      process.stderr.write('请先在浏览器中生成 Personal Access Token：\n');
      process.stderr.write('  https://jira.kanjian.com → 右上角头像 → Profile → Personal Access Tokens\n\n');

      const token = await new Promise<string>(resolve => {
        rl.question('请粘贴 Token：', answer => resolve(answer.trim()));
      });

      if (!token) {
        rl.close();
        fail('Token 不能为空', 'validation');
      }

      const host = 'jira.kanjian.com';
      const config = { host, token };

      // 先保存，再用 client 验证
      saveConfig(config);
      resetClient();

      try {
        const user = await (getClient() as any).genericGet('myself') as any;
        process.stderr.write(`\n验证成功！当前用户：${user.displayName} (${user.name})\n`);

        // 无论是否设置团队成员，me 始终写入
        const me = user.name as string;
        const existingTeam = loadTeamConfig();
        saveTeamConfig({ me, team: existingTeam.team });

        const setupTeam = await new Promise<string>(resolve => {
          rl.question('\n是否现在添加团队成员？可跳过，之后随时用 kdev jira team-add 添加 (y/N) ', answer => resolve(answer.trim().toLowerCase()));
        });

        if (setupTeam === 'y') {
          process.stderr.write('请输入团队成员姓名（支持中文名搜索），留空结束：\n');
          const members: Array<{ username: string; displayName: string }> = [];

          const askMember = (): Promise<void> =>
            new Promise(resolve => {
              rl.question('姓名（留空结束）：', async answer => {
                const query = answer.trim();
                if (!query) {
                  resolve();
                  return;
                }
                try {
                  const users = await (getClient() as any).searchUsers({ username: query, maxResults: 5 }) as any[];
                  if (users.length === 0) {
                    process.stderr.write(`  未找到 "${query}"，跳过\n`);
                  } else if (users.length === 1) {
                    const found = users[0];
                    members.push({ username: found.name, displayName: found.displayName });
                    process.stderr.write(`  已添加：${found.displayName} (${found.name})\n`);
                  } else {
                    process.stderr.write(`  找到多个结果，请选择序号：\n`);
                    users.forEach((u: any, i: number) => {
                      process.stderr.write(`    ${i + 1}. ${u.displayName} (${u.name})\n`);
                    });
                    const pick = await new Promise<string>(r => rl.question('  序号（留空跳过）：', r));
                    const idx = parseInt(pick.trim()) - 1;
                    if (idx >= 0 && idx < users.length) {
                      const found = users[idx];
                      members.push({ username: found.name, displayName: found.displayName });
                      process.stderr.write(`  已添加：${found.displayName} (${found.name})\n`);
                    } else {
                      process.stderr.write(`  已跳过\n`);
                    }
                  }
                } catch {
                  process.stderr.write(`  查询失败，跳过\n`);
                }
                await askMember();
                resolve();
              });
            });

          await askMember();
          saveTeamConfig({ me, team: members });
          process.stderr.write(`\n已保存团队配置（${members.length} 人）\n`);
        }

        rl.close();
        out({ success: true, username: user.name, displayName: user.displayName });
      } catch (e) {
        rl.close();
        // 验证失败，删除刚写的配置
        try {
          fs.unlinkSync(getConfigPath());
        } catch {}
        fail('Token 验证失败，请检查后重试', 'auth');
      }
    });
}
