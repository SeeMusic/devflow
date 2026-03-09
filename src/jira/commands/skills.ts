import { Command } from 'commander';
import { spawnSync } from 'child_process';

export function registerSkills(jira: Command): void {
  const skills = new Command('skills').description('Skill 管理');

  skills
    .command('add')
    .description('安装 devflow skill 到 AI 客户端')
    .option('-a, --agent <name>', '目标 AI 客户端，可重复指定（如 claude-code、codex）', (val, prev: string[]) => [...prev, val], [])
    .action((opts: { agent: string[] }) => {
      if (opts.agent.length === 0) {
        process.stderr.write('请通过 -a 指定目标 AI 客户端，例如：kdev jira skills add -a claude-code\n');
        process.exit(1);
      }
      const agents = [...new Set(opts.agent)];
      const agentArgs = agents.flatMap(a => ['-a', a]);
      const args = ['--yes', 'skills', 'add', 'SeeMusic/devflow', '-g', '-y', '--skills', '*', ...agentArgs];

      console.log(`Installing skills for: ${agents.join(', ')}...`);
      const result = spawnSync('npx', args, { stdio: 'inherit' });
      if (result.status !== 0) process.exit(result.status ?? 1);
    });

  jira.addCommand(skills);
}
