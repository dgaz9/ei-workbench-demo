/* Lazy browser boot for AFTO 752A PDF export. Loaded only when the user asks
   to save a PDF; until then the shared pinned PDF.js engine is never fetched.
   The host serves this file and the pinned 752A adapter through the same
   key-auth'd, allow-listed static route as AFTO 749. `window.__afto752aGenerate`
   is the only global it installs.

   The engine module stays the shared 749 release asset
   (/afto749-pdf-5.6.205.min.mjs); this file adds no new engine dependency and
   no duplicate PDF.js files. The adapter remains a modern ES module; the ES5
   shell never loads this file directly.

   Resolved modules are cached, but a REJECTED load is not: a transient fetch
   failure is thrown to the caller and the next call retries, and concurrent
   callers share the one in-flight load instead of racing to fetch the engine. */
let pdfjs = null;
let adapter = null;
let loading = null;
let retry = 0;

function load() {
  if (pdfjs && adapter) return Promise.resolve({ pdfjs, adapter });
  if (!loading) {
    loading = (async () => {
      const key = new URLSearchParams(window.location.search).get("key") || "";
      const suffix = "?key=" + encodeURIComponent(key) + (retry ? "&eiRetry=" + retry : "");
      try {
        if (!pdfjs) pdfjs = await import("./afto749-pdf-5.6.205.min.mjs" + suffix);
        adapter = await import("./afto752a-export-adapter.mjs" + suffix);
      } catch (err) {
        // Browsers cache module failures by URL. A fresh URL retries the
        // same authenticated, signed asset without discarding a loaded engine.
        retry++;
        throw err;
      } finally {
        loading = null;
      }
      return { pdfjs, adapter };
    })();
  }
  return loading;
}

window.__afto752aGenerate = async function (options) {
  const { pdfjs: pdf, adapter: mod } = await load();
  return mod.generateFilledPdf(Object.assign({}, options, { pdfjs: pdf }));
};
