// Browser storage that never throws (private windows and locked-down Chromebooks can block it).
function wrap(area) {
  const s = () => { try { return window[area]; } catch { return null; } };
  return {
    get(k, fallback = null) {
      try { const v = s()?.getItem(k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(k, v) { try { s()?.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
    del(k) { try { s()?.removeItem(k); } catch { /* ignore */ } },
  };
}
export const store = { local: wrap('localStorage'), session: wrap('sessionStorage') };
