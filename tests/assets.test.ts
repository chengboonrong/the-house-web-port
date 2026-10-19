import { describe, expect, it, vi } from 'vitest';
import { AssetLoader, portAssetUrls, sceneAssetUrls } from '../src/port/assets';
import { demoSpec } from '../src/port/demo';

describe('asset loader', () => {
  it('deduplicates concurrent loads and caches decoded assets', async () => {
    const decode = vi.fn(async (url: string) => ({ url }));
    const loader = new AssetLoader(decode);
    const [a,b] = await Promise.all([loader.load('/x.svg'), loader.load('/x.svg')]);
    expect(a).toBe(b);
    expect(decode).toHaveBeenCalledTimes(1);
    await loader.load('/x.svg');
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it('retries failed downloads and deduplicates preloads', async () => {
    const decode = vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValue('ok');
    const loader = new AssetLoader<string>(decode);
    await expect(loader.load('/missing')).rejects.toThrow('offline');
    await loader.preload(['/missing','/missing']);
    expect(loader.get('/missing')).toBe('ok');
    expect(decode).toHaveBeenCalledTimes(2);
  });

  it('enumerates scene image URLs without blanks or duplicates', () => {
    const assets = sceneAssetUrls(demoSpec.scenes[0]);
    expect(assets).toEqual(['/demo-room.svg','/demo-mark.svg']);
    expect(portAssetUrls(demoSpec)).toEqual([...assets, '/demo-hall.svg']);
  });
});
