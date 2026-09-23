import { beforeAll, describe, expect, it } from 'vitest';
import { GitStatusService } from '../../src/core/git/status.js';
import { ensureFixtureRepo, fixturePath } from '../fixtures/create-fixture.js';

describe('GitStatusService', () => {
  let service: GitStatusService;

  beforeAll(async () => {
    await ensureFixtureRepo();
    service = new GitStatusService();
  });

  it('reports working tree clean state in fixture', async () => {
    const status = await service.status(fixturePath);
    expect(status.clean).toBe(true);
    expect(status.staged).toHaveLength(0);
    expect(status.unstaged).toHaveLength(0);
    expect(status.untracked).toHaveLength(0);
  });
});
