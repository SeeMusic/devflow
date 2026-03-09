export function out(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

export function fail(error: string, code: string): never {
  process.stderr.write(JSON.stringify({ error, code }) + '\n');
  process.exit(1);
}

export function wrapApiError(e: unknown, defaultCode = 'network'): never {
  if (e instanceof Error) {
    const msg = e.message;
    if (msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized') || msg.includes('Forbidden')) {
      fail(msg, 'auth');
    }
    if (msg.includes('404') || msg.includes('Not Found')) {
      fail(msg, 'not_found');
    }
    fail(msg, defaultCode);
  }
  fail(String(e), defaultCode);
}
