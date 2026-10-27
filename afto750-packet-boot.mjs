/* Lazy browser boot for the AFTO 750 + 750A review packet release assets.
   Loaded only when a caller asks to generate a packet or prepare its canonical
   inputs; until then neither the
   shared pinned PDF.js engine nor the packet coordinator is fetched. The host
   serves this file and the packet release modules through the same key-auth'd,
   allow-listed static routes as AFTO 749/752A. `window.__afto750PacketGenerate`
   and `window.__afto750PacketPrepareInputs` are the only globals it installs.

   The engine module stays the shared 749 release asset
   (/afto749-pdf-5.6.205.min.mjs); this file adds no new engine dependency and
   no duplicate PDF.js files. The packet coordinator is a transformed
   release-only flat module graph: its build-time rewritten dependencies carry
   the parent's key and retry generation on every descendant import, so static
   ES module imports do not lose the query string the host requires.

   Resolved modules are cached, but a REJECTED load is not: a transient failure
   anywhere in the packet graph is thrown to the caller and the next call
   retries the whole graph with a fresh URL generation. A successfully loaded
   engine is retained and reused. Concurrent callers share the one in-flight
   load instead of racing to fetch the engine or packet. */
let engine = null;
let packet = null;
let loading = null;
let packetLoading = null;
let retry = 0;
let packetRetry = 0;

function load() {
  if (engine && packet) return Promise.resolve({ engine, packet });
  if (!loading) {
    loading = (async () => {
      const key = new URLSearchParams(window.location.search).get("key") || "";
      const suffix = "?key=" + encodeURIComponent(key) + (retry ? "&eiRetry=" + retry : "");
      try {
        if (!engine) engine = await import("./afto749-pdf-5.6.205.min.mjs" + suffix);
        if (!packet) packet = await import("./afto750-packet.mjs" + suffix);
      } catch (err) {
        // Browsers cache module failures by URL. A fresh URL retries the same
        // authenticated, signed graph without discarding a loaded engine. The
        // packet module copies this URL's generation onto every transformed
        // descendant import, so a cached failed child is retried too.
        retry++;
        throw err;
      } finally {
        loading = null;
      }
      return { engine, packet };
    })();
  }
  return loading;
}

/* Load only the transformed packet graph, never the PDF.js engine. The bridge
   uses this for canonical currentness: answering whether the saved review
   changed must not pay the cost of the engine just to prepare inputs. */
function loadPacket() {
  if (packet) return Promise.resolve({ packet });
  if (!packetLoading) {
    packetLoading = (async () => {
      const key = new URLSearchParams(window.location.search).get("key") || "";
      const suffix = "?key=" + encodeURIComponent(key) + (packetRetry ? "&eiRetry=" + packetRetry : "");
      try {
        packet = await import("./afto750-packet.mjs" + suffix);
      } catch (err) {
        packetRetry++;
        throw err;
      } finally {
        packetLoading = null;
      }
      return { packet };
    })();
  }
  return packetLoading;
}

window.__afto750PacketGenerate = async function (options) {
  const { engine: pdfjs, packet: mod } = await load();
  // The loaded engine is authoritative; caller options can supply model,
  // SHA-256, templates and selection but never replace PDF.js.
  return mod.generatePacket(Object.assign({}, options, { pdfjs }));
};

window.__afto750PacketPrepareInputs = async function (options) {
  const { packet: mod } = await loadPacket();
  return mod.preparePacketInputs(options);
};
