// data.js — load all content JSON (single source of truth)
const FILES = ['profile', 'projects', 'workflows', 'research', 'changelog', 'status'];

export async function loadData() {
  const out = {};
  await Promise.all(FILES.map(async (f) => {
    try {
      const res = await fetch(`data/${f}.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      out[f] = await res.json();
    } catch (e) {
      console.warn(`[zima] could not load data/${f}.json —`, e.message);
      out[f] = null;
    }
  }));
  return out;
}

// true when opened via file:// (fetch of local JSON is blocked → needs a server)
export const needsServer = () => location.protocol === 'file:';
