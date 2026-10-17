import "./app.js";

// Load the 3D background only when it will actually run well, and after the page is usable.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGL = (() => {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch { return false; }
})();
if (!reduce && hasGL) {
  const idle = window.requestIdleCallback || (cb => setTimeout(cb, 200));
  idle(() => import("./bg/Background.jsx")
    .then(m => { m.mount(document.getElementById("bg")); document.documentElement.classList.add("has-3d"); })
    .catch(err => console.warn("3D background disabled:", err)));
}
