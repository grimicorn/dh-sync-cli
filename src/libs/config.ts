import Conf from 'conf';
import packageJson from './../../package.json' with { type: 'json' };
import { input } from '@inquirer/prompts';
import chalk from 'chalk';

const schema = {
  apiToken: {
    type: 'string',
  },
};

export const config = new Conf({
  projectName: packageJson.name,
  schema,
});

export const checkConfig = async () => {
  if (!config.get('apiToken')) {
    const apiToken = await input({ message: 'What is your Sync API Token' });

    if (!apiToken) {
      console.error(chalk.redBright('Sync API Token is required!'));
      process.exit();
    }

    config.set('apiToken', apiToken);
  }

  return;
};
