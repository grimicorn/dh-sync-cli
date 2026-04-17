import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { input } from '@inquirer/prompts';
import { checkConfig } from '@/libs/config.js';

const { mockGet, mockSet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
}));

vi.mock('conf', () => ({
  default: vi.fn().mockImplementation(function () {
    return { get: mockGet, set: mockSet };
  }),
}));

vi.mock('@inquirer/prompts', () => ({ input: vi.fn() }));

describe('checkConfig', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
    mockGet.mockReset();
    mockSet.mockReset();
    vi.mocked(input).mockReset();
  });

  it('returns without prompting when token is already set', async () => {
    mockGet.mockReturnValue('existing-token');
    await checkConfig();
    expect(input).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('sets token when user provides one', async () => {
    mockGet.mockReturnValue(undefined);
    vi.mocked(input).mockResolvedValue('my-token');
    await checkConfig();
    expect(mockSet).toHaveBeenCalledWith('apiToken', 'my-token');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('logs error and exits when user enters empty token', async () => {
    mockGet.mockReturnValue(undefined);
    vi.mocked(input).mockResolvedValue('');
    await checkConfig();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Sync API Token is required!'));
    expect(exitSpy).toHaveBeenCalled();
  });
});
