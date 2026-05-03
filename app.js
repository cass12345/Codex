const seedProjects = [
  { id: 1, name: 'Website Redesign', owner: 'Lena', status: 'current', progress: 62, budget: 42000, dueDate: '2026-06-18' },
  { id: 2, name: 'CRM Migration', owner: 'Maya', status: 'current', progress: 35, budget: 75000, dueDate: '2026-08-30' },
  { id: 3, name: 'AI Support Bot', owner: 'Isaac', status: 'potential', progress: 10, budget: 25000, dueDate: '2026-11-15' },
  { id: 4, name: 'Legacy Sunset', owner: 'Tom', status: 'archived', progress: 100, budget: 18000, dueDate: '2025-12-10' },
];

const storeKey = 'projectTrackerDataV1';
let projects = JSON.parse(localStorage.getItem(storeKey) || 'null') || seedProjects;
let activeFilter = 'all';

const $ = (id) => document.getElementById(id);

function saveProjects() { localStorage.setItem(storeKey, JSON.stringify(projects)); }
function currency(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n); }

function filtered() { return activeFilter === 'all' ? projects : projects.filter((p) => p.status === activeFilter); }

function updateDashboard() {
  const total = projects.length;
  const counts = ['current', 'potential', 'archived'].reduce((a, s) => ({ ...a, [s]: projects.filter((p) => p.status === s).length }), {});
  const avgProgress = total ? Math.round(projects.reduce((s, p) => s + Number(p.progress || 0), 0) / total) : 0;
  const totalBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);

  $('totalCount').textContent = total;
  $('currentCount').textContent = counts.current;
  $('potentialCount').textContent = counts.potential;
  $('archivedCount').textContent = counts.archived;
  $('avgProgress').textContent = `${avgProgress}%`;
  $('totalBudget').textContent = currency(totalBudget);

  drawStatusChart(counts);
  drawBudgetChart();
}

function drawBars(canvasId, items, color) {
  const c = $(canvasId), ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  ctx.clearRect(0,0,w,h);
  const max = Math.max(1, ...items.map((i) => i.value));
  const bw = (w - 50) / items.length - 22;
  items.forEach((item, i) => {
    const x = 35 + i * (bw + 22);
    const barH = (item.value / max) * (h - 55);
    const y = h - barH - 28;
    ctx.fillStyle = color[i % color.length];
    ctx.fillRect(x, y, bw, barH);
    ctx.fillStyle = '#1a1f36';
    ctx.font = '12px sans-serif';
    ctx.fillText(item.label, x, h - 10);
    ctx.fillText(String(item.value), x, y - 6);
  });
}

function drawStatusChart(counts) {
  drawBars('statusChart', [
    { label: 'Current', value: counts.current },
    { label: 'Potential', value: counts.potential },
    { label: 'Archived', value: counts.archived }
  ], ['#3d5afe', '#ef6c00', '#546e7a']);
}

function drawBudgetChart() {
  const byStatus = ['current', 'potential', 'archived'].map((s) => ({
    label: s[0].toUpperCase() + s.slice(1),
    value: projects.filter((p) => p.status === s).reduce((sum, p) => sum + Number(p.budget || 0), 0)
  }));
  drawBars('budgetChart', byStatus, ['#1565c0', '#fb8c00', '#455a64']);
}

function renderTable() {
  $('projectRows').innerHTML = filtered().map((p) => `
    <tr>
      <td>${p.name}</td>
      <td>${p.owner}</td>
      <td><span class="status ${p.status}">${p.status}</span></td>
      <td>${p.progress}%</td>
      <td>${currency(p.budget)}</td>
      <td>${p.dueDate || '-'}</td>
      <td><button onclick="removeProject(${p.id})">Delete</button></td>
    </tr>`).join('') || '<tr><td colspan="7">No projects for this filter.</td></tr>';
}

function removeProject(id) {
  projects = projects.filter((p) => p.id !== id);
  saveProjects();
  renderAll();
}
window.removeProject = removeProject;

function renderAll() { updateDashboard(); renderTable(); }

$('project-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const project = {
    id: Date.now(),
    name: $('name').value.trim(),
    owner: $('owner').value.trim(),
    status: $('status').value,
    progress: Number($('progress').value || 0),
    budget: Number($('budget').value || 0),
    dueDate: $('dueDate').value
  };
  projects.unshift(project);
  saveProjects();
  e.target.reset();
  $('status').value = 'current';
  renderAll();
});

$('filter-buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-filter]');
  if (!btn) return;
  activeFilter = btn.dataset.filter;
  [...$('filter-buttons').children].forEach((b) => b.classList.toggle('active', b === btn));
  renderTable();
});

renderAll();
