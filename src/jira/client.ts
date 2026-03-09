import JiraClient from 'jira-client';
import { loadConfig } from './config';

let _client: JiraClient | null = null;

export function getClient(): JiraClient {
  if (!_client) {
    const config = loadConfig();
    _client = new JiraClient({
      protocol: 'https',
      host: config.host,
      bearer: config.token,
      apiVersion: '2',
      strictSSL: false,
    });
  }
  return _client;
}

export function resetClient(): void {
  _client = null;
}
