import { Command } from 'commander';
import { createRequire } from 'module';
import { createJiraCommand } from './jira/index';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('kdev')
  .description('DevFlow CLI — agent-first 开发者工具链')
  .version(version);

program.addCommand(createJiraCommand());

program.parseAsync(process.argv);
