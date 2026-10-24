import { createLocalId } from './local-id';

describe('local identifiers', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('creates distinct identifiers with the requested prefix', () => {
    const ids = Array.from({ length: 100 }, () => createLocalId('document'));
    expect(ids.every(id => id.startsWith('document-'))).toBe(true);
    expect(new Set(ids).size).toBe(100);
  });

  it('uses cryptographic bytes when the browser has no randomUUID method', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => bytes.map((_, index) => index)
    });
    expect(createLocalId('section')).toBe('section-000102030405060708090a0b0c0d0e0f');
  });
});
