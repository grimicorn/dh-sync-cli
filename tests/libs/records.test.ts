import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  recordsCreate,
  recordsDelete,
  recordsIndex,
  recordsShow,
} from '@/libs/records.js';
import { ApiDeleteMeta } from '@/types/api.types.js';
import { Record } from '@/types/records.types.js';

vi.mock('@/libs/api.js', () => ({
  getBaseUrl: () => 'https://example.com',
  getApiToken: () => 'test-token',
  logErrorMessage: vi.fn(),
  formatErrorMessages: (errors: { title: string; detail: string }[]) =>
    errors.map((e) => `${e.title}: ${e.detail}`).join('\n'),
}));

const mockRecord: Record = {
  uuid: 'abc-123',
  title: 'Test Title',
  content: 'Test Content',
  createdAt: '2024-01-01T00:00:00Z',
};

const mockMeta: ApiDeleteMeta = { deleted: 1 };

function mockFetch(responseBody: object, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(responseBody),
  });
}

describe('recordsIndex', () => {
  it('calls fetch with the correct URL and auth header', async () => {
    mockFetch({ data: [mockRecord] });
    await recordsIndex(2, 50);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/records?page[number]=2&page[size]=50',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      }),
    );
  });

  it('returns records on success', async () => {
    mockFetch({ data: [mockRecord] });
    expect(await recordsIndex()).toEqual([mockRecord]);
  });

  it('returns [] when the response contains errors', async () => {
    mockFetch(
      { data: { errors: [{ title: 'Error', detail: 'Server error' }] } },
      false,
    );
    expect(await recordsIndex()).toEqual([]);
  });

  it('returns [] on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    expect(await recordsIndex()).toEqual([]);
  });
});

describe('recordsCreate', () => {
  it('calls fetch with POST, correct headers, and JSON:API body', async () => {
    mockFetch({ data: { attributes: mockRecord } });
    await recordsCreate('Test Title', 'Test Content');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/records',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          data: {
            type: 'records',
            attributes: { title: 'Test Title', content: 'Test Content' },
          },
        }),
      }),
    );
  });

  it('returns the record attributes on success', async () => {
    mockFetch({ data: { attributes: mockRecord } });
    expect(await recordsCreate('Test Title', 'Test Content')).toEqual(
      mockRecord,
    );
  });

  it('returns null when the response contains errors', async () => {
    mockFetch(
      { data: { errors: [{ title: 'Error', detail: 'Bad request' }] } },
      false,
    );
    expect(await recordsCreate('Test Title', 'Test Content')).toBeNull();
  });

  it('returns null on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    expect(await recordsCreate('Test Title', 'Test Content')).toBeNull();
  });
});

describe('recordsShow', () => {
  it('calls fetch with the correct UUID in the URL', async () => {
    mockFetch({ data: { attributes: mockRecord } });
    await recordsShow('abc-123');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/records/abc-123',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      }),
    );
  });

  it('returns the record attributes on success', async () => {
    mockFetch({ data: { attributes: mockRecord } });
    expect(await recordsShow('abc-123')).toEqual(mockRecord);
  });

  it('returns null when the response contains errors', async () => {
    mockFetch(
      { data: { errors: [{ title: 'Not Found', detail: 'Record missing' }] } },
      false,
    );
    expect(await recordsShow('abc-123')).toBeNull();
  });

  it('returns null on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    expect(await recordsShow('abc-123')).toBeNull();
  });
});

describe('recordsDelete', () => {
  it('calls fetch with DELETE, correct headers, and JSON:API body', async () => {
    mockFetch({ meta: mockMeta });
    await recordsDelete(['abc-123', 'def-456']);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/records',
      expect.objectContaining({
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          data: {
            type: 'records',
            attributes: { uuids: ['abc-123', 'def-456'] },
          },
        }),
      }),
    );
  });

  it('returns meta on success', async () => {
    mockFetch({ meta: mockMeta });
    expect(await recordsDelete(['abc-123'])).toEqual(mockMeta);
  });

  it('returns null when the response contains errors', async () => {
    mockFetch(
      { data: { errors: [{ title: 'Error', detail: 'Bad request' }] } },
      false,
    );
    expect(await recordsDelete(['abc-123'])).toBeNull();
  });

  it('returns null on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    expect(await recordsDelete(['abc-123'])).toBeNull();
  });
});
