/* =========================================================================
   PYTHON WEB WORKER
   Hosts the Pyodide (WebAssembly Python) runtime on a background thread so
   heavy execution — infinite loops included — can never freeze the page.
   Used by both the terminal REPL (cli.js) and the course playgrounds
   (app.js) through the shared window.PyRuntime wrapper, which serializes
   requests so stdout/stderr attribution is unambiguous.

   Protocol (worker <- page):  { type: 'init'|'run'|'pip', id, code?, pkg? }
   Protocol (worker -> page):  { type: 'stdout'|'stderr', text }
                               { type: 'ready'|'result'|'error', id, value?, message? }
   ========================================================================= */
'use strict';

let pyodide = null;

const post = (msg) => self.postMessage(msg);

async function ensurePyodide() {
  if (pyodide) return pyodide;
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
  pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    stdout: (text) => post({ type: 'stdout', text }),
    stderr: (text) => post({ type: 'stderr', text }),
  });
  return pyodide;
}

self.onmessage = async (e) => {
  const { type, id, code, pkg } = e.data;
  try {
    if (type === 'init') {
      await ensurePyodide();
      post({ type: 'ready', id });
    } else if (type === 'run') {
      const py = await ensurePyodide();
      const result = await py.runPythonAsync(code);
      post({
        type: 'result',
        id,
        value: (result === undefined || result === null) ? null : String(result),
      });
    } else if (type === 'pip') {
      const py = await ensurePyodide();
      await py.loadPackage('micropip');
      const micropip = py.pyimport('micropip');
      await micropip.install(pkg);
      post({ type: 'result', id, value: null });
    }
  } catch (err) {
    post({ type: 'error', id, message: String((err && err.message) || err) });
  }
};
