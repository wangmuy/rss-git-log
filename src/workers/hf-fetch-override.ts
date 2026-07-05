// Install fetch override BEFORE transformers.js loads.
// ES modules evaluate imports in order — this module runs first,
// so transformers.js captures the proxied fetch.
//
// DEV ONLY: HuggingFace may be unreachable from some networks during
// local development. Route model downloads through a CORS proxy +
// hf-mirror.com fallback. In production builds this is a no-op.

if (import.meta.env.DEV) {
  const HF_PROXY = 'https://corsproxy.io/?';
  const HF_MIRROR = 'hf-mirror.com';
  const _originalFetch = self.fetch.bind(self);

  (self as any).fetch = async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    if (url.includes('huggingface.co')) {
      const mirrorUrl = url.replace('huggingface.co', HF_MIRROR);
      const proxyUrl = HF_PROXY + encodeURIComponent(mirrorUrl);
      console.log('[W2] routing HF request via CORS proxy:', mirrorUrl.slice(0, 80));
      return _originalFetch(proxyUrl, init);
    }
    return _originalFetch(input, init);
  };

  console.log('[W2] fetch override installed for HuggingFace proxying (dev only)');
}
