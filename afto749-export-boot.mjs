/* Lazy browser boot for AFTO 749 PDF export. Loaded only when the user asks to
   save a PDF; until then PDF.js is never fetched. The host serves this file and
   the pinned PDF.js/adapter assets through the same key-auth'd, allow-listed
   static route. `window.__afto749Generate` is the only global it installs. */
let pdfjs = null;
let adapter = null;
let failed = null;

async function load() {
  if (failed) throw failed;
  if (pdfjs && adapter) return { pdfjs, adapter };
  const key = new URLSearchParams(window.location.search).get("key") || "";
  const suffix = key ? "?key=" + encodeURIComponent(key) : "";
  try {
    pdfjs = await import("./afto749-pdf-5.6.205.min.mjs" + suffix);
    adapter = await import("./afto749-export-adapter.mjs" + suffix);
  } catch (err) {
    failed = err;
    throw err;
  }
  return { pdfjs, adapter };
}

window.__afto749Generate = async function (options) {
  const { pdfjs: pdf, adapter: mod } = await load();
  return mod.generateFilledPdf(Object.assign({}, options, { pdfjs: pdf }));
};
