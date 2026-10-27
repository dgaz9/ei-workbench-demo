/* Lazy authenticated AFTO752 graph; inspection loads no PDF engine. */
let adapter = null, pdfjs = null, adapterLoading = null, engineLoading = null;
let retry = 0;
function asset(name) {
  const url = new URL(name, window.location.href);
  url.searchParams.set('key', new URLSearchParams(window.location.search).get('key') || '');
  if (retry) url.searchParams.set('eiRetry', String(retry));
  return url.href;
}
function loadAdapter() {
  if (adapter) return Promise.resolve(adapter);
  if (!adapterLoading) {
    adapterLoading = import(asset('afto752-export-adapter.mjs')).then(mod => {
      adapter = mod; return mod;
    }).catch(error => { retry++; throw error; }).finally(() => { adapterLoading = null; });
  }
  return adapterLoading;
}
function loadEngine() {
  if (pdfjs) return Promise.resolve(pdfjs);
  if (!engineLoading) {
    engineLoading = import(asset('afto749-pdf-5.6.205.min.mjs')).then(mod => {
      pdfjs = mod; return mod;
    }).catch(error => { retry++; throw error; }).finally(() => { engineLoading = null; });
  }
  return engineLoading;
}
window.__afto752Plan = async function (record, projectId, model) {
  return (await loadAdapter()).createPlan(record, projectId, model);
};
window.__afto752Generate = async function (options) {
  const mod = await loadAdapter();
  const pdf = await loadEngine();
  return mod.generateFilledPdf(Object.assign({}, options, {
    pdfjs: pdf, workerSrc: asset('afto749-pdf.worker-5.6.205.min.mjs')
  }));
};
