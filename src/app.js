// Renders the HTML layer (timeline cards) from window.SITE / window.PROJECTS (public/projects.js).
const S = window.SITE || {}, P = window.PROJECTS || [];
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const label = {live:"Live", building:"In progress", soon:"Coming next"};

$("name").textContent = S.name || "Projects";
document.title = (S.name || "") + " — Projects";

const years = [...new Set(P.map(p => p.year).filter(Boolean))].sort((a,b) => b - a);
let year = "all", query = "";

function renderYears(){
  $("years").innerHTML = ["all", ...years].map(y =>
    `<button type="button" data-y="${esc(y)}" class="${y === year ? "on" : ""}">${y === "all" ? "All" : esc(y)}</button>`).join("");
}
function renderTimeline(){
  const q = query.trim().toLowerCase();
  const items = P.map((p, i) => ({p, i})).filter(({p}) =>
    (year === "all" || String(p.year) === String(year)) &&
    (!q || [p.title, p.description, (p.tags||[]).join(" ")].join(" ").toLowerCase().includes(q)));
  if (!items.length) { $("timeline").innerHTML = '<p class="empty">No projects match.</p>'; return; }
  $("timeline").innerHTML = items.map(({p, i}, n) => {
    const st = p.status || "live";
    const linked = !!p.url && st !== "soon";
    const tag = linked ? "a" : "div";
    const href = linked ? ` href="${esc(p.url)}"` : "";
    const tags = (p.tags || []).map(t => `<span>${esc(t)}</span>`).join("");
    return `<section class="node ${esc(st)}">
      <i class="dot"></i>
      <${tag} class="card reveal"${href} style="animation-delay:${n*90}ms">
        <div class="shot"><span class="badge">${label[st] || esc(st)}</span><span class="big">${String(i+1).padStart(2,"0")}</span><div class="chips">${tags}</div></div>
        <div class="body">
          <h3>${esc(p.title)}</h3>
          <div class="meta">${esc(p.year || "")}${p.year ? " · " : ""}${label[st] || esc(st)}</div>
          <p>${esc(p.description)}</p>
          <div class="go"><span>${linked ? "See Details" : "Stay tuned"}</span>${linked ? "<b aria-hidden=\"true\">→</b>" : ""}</div>
        </div>
      </${tag}>
    </section>`;
  }).join("");
}

$("years").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  year = b.dataset.y; renderYears(); renderTimeline();
});

renderYears(); renderTimeline();

$("copy").textContent = "© " + new Date().getFullYear() + " " + (S.name || "");
const links = (S.links || []).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`);
if (S.email) links.push(`<a href="mailto:${esc(S.email)}">Email</a>`);
$("links").innerHTML = links.join("");
