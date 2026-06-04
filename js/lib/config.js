// config.js — runtime configuration.
// After you deploy the Cloudflare Worker, set apiBase to its URL and the live
// features (online status, message board, 蹲蹲 counts, waitlist) go live.
// Until then the site runs fully on local JSON + optimistic local state.
export const config = {
  apiBase: '',            // e.g. 'https://zima-api.xing0325.workers.dev'
  duduStorageKey: 'zima_dudu_v1',
  // online is considered stale (→ show offline) if lastSeen is older than this
  onlineStaleMs: 4 * 60 * 1000,
};
