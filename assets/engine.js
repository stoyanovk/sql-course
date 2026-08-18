/* =====================================================================
   engine.js — the interactive core of the SQL course.
   - Boots a REAL Postgres (PGlite/WASM) in the browser.
   - Seeds it once from ./seed.js (shared shop database).
   - Wires up three reusable widgets found in any lesson:
       .sql-playground   free query runner, no checking
       .sql-exercise     task + editor + auto-check against a hidden solution
       .quiz             multiple-choice with instant feedback
   Lessons stay almost pure HTML; all behaviour lives here.
   ===================================================================== */

import { SEED_SQL } from './seed.js';

const PGLITE_URL = 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js';

/* ---- database singleton -------------------------------------------- */
let _dbPromise = null;
async function getDb() {
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const { PGlite } = await import(PGLITE_URL);
      const db = new PGlite();
      await db.exec(SEED_SQL);
      return db;
    })();
  }
  return _dbPromise;
}

/** Re-seed the database back to its original state (used by DML lessons). */
export async function resetDatabase() {
  const db = await getDb();
  await db.exec(SEED_SQL);
}

/* ---- query helpers -------------------------------------------------- */
async function runMany(sql) {
  // Permissive: allow one or many statements; return the last result set.
  const db = await getDb();
  const res = await db.exec(sql);
  const list = Array.isArray(res) ? res : [res];
  const withFields = list.filter(r => r && r.fields && r.fields.length);
  const last = withFields.length ? withFields[withFields.length - 1] : list[list.length - 1];
  return { rows: (last && last.rows) || [], fields: (last && last.fields) || [] };
}
async function runOne(sql) {
  const db = await getDb();
  const r = await db.query(sql);
  return { rows: r.rows || [], fields: r.fields || [] };
}

/* ---- value normalisation for comparison ---------------------------- */
function normNumber(n) {
  const x = Number(n);
  if (!isFinite(x)) return String(n);
  if (Number.isInteger(x)) return String(x);
  return String(parseFloat(x.toFixed(6)));
}
function normCell(v) {
  if (v === null || v === undefined) return '␀';           // ␀
  if (typeof v === 'boolean') return v ? 't' : 'f';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'number') return normNumber(v);
  if (typeof v === 'string') {
    const s = v.trim();
    if (/^-?\d+(\.\d+)?$/.test(s)) return normNumber(s);        // numeric string
    return s;
  }
  return JSON.stringify(v);
}
function canonicalRow(row, fields) {
  const cells = fields.map(f => normCell(row[f.name]));
  cells.sort();                       // column-order & alias insensitive
  return JSON.stringify(cells);
}
function compare(user, expected, orderMatters) {
  if (user.fields.length !== expected.fields.length) {
    return { ok: false, why: `ожидалось столбцов: ${expected.fields.length}, у тебя: ${user.fields.length}.` };
  }
  const u = user.rows.map(r => canonicalRow(r, user.fields));
  const e = expected.rows.map(r => canonicalRow(r, expected.fields));
  if (u.length !== e.length) {
    return { ok: false, why: `ожидалось строк: ${e.length}, у тебя: ${u.length}.` };
  }
  if (orderMatters) {
    for (let i = 0; i < e.length; i++) {
      if (u[i] !== e[i]) return { ok: false, why: `строка ${i + 1} не совпадает (важен порядок ORDER BY).` };
    }
    return { ok: true };
  }
  const us = [...u].sort(), es = [...e].sort();
  for (let i = 0; i < es.length; i++) {
    if (us[i] !== es[i]) return { ok: false, why: 'набор строк не совпадает с ожидаемым.' };
  }
  return { ok: true };
}

/* ---- rendering ------------------------------------------------------ */
function displayCell(v) {
  if (v === null || v === undefined) return { text: 'NULL', cls: 'null' };
  if (v instanceof Date) return { text: v.toISOString().slice(0, 10), cls: '' };
  if (typeof v === 'object') return { text: JSON.stringify(v), cls: '' };
  return { text: String(v), cls: '' };
}
function renderTable(container, fields, rows) {
  container.innerHTML = '';
  if (!fields.length) {
    const p = document.createElement('p');
    p.className = 'result-meta';
    p.textContent = 'Запрос выполнен. Строк нет.';
    container.appendChild(p);
    return;
  }
  const meta = document.createElement('p');
  meta.className = 'result-meta';
  const shown = Math.min(rows.length, 100);
  meta.textContent = `${rows.length} стр. × ${fields.length} стлб.` + (rows.length > shown ? ` (показаны первые ${shown})` : '');
  container.appendChild(meta);

  const scroll = document.createElement('div');
  scroll.className = 'result-scroll';
  const table = document.createElement('table');
  table.className = 'result';
  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  fields.forEach(f => { const th = document.createElement('th'); th.textContent = f.name; htr.appendChild(th); });
  thead.appendChild(htr);
  table.appendChild(thead);
  const tb = document.createElement('tbody');
  rows.slice(0, shown).forEach(row => {
    const tr = document.createElement('tr');
    fields.forEach(f => {
      const td = document.createElement('td');
      const d = displayCell(row[f.name]);
      td.textContent = d.text;
      if (d.cls) td.className = d.cls;
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
  table.appendChild(tb);
  scroll.appendChild(table);
  container.appendChild(scroll);
}
function errorText(e) {
  const m = (e && (e.message || e.toString())) || 'неизвестная ошибка';
  return m.replace(/^error:\s*/i, '');
}

/* ---- small DOM utils ------------------------------------------------ */
function el(tag, cls, txt) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
}
function grab(host, sel) {
  const n = host.querySelector(sel);
  return n ? n.textContent : '';
}
function makeEditor(initial, minH) {
  const ta = el('textarea', 'sql-editor');
  ta.spellcheck = false;
  ta.value = initial || '';
  if (minH) ta.style.minHeight = minH + 'px';
  ta.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      const btn = ta.closest('.sql-widget').querySelector('.run-btn');
      if (btn) btn.click();
    }
  });
  return ta;
}

/* ---- progress bookkeeping ------------------------------------------ */
const solved = new Set();
function refreshProgress() {
  const total = document.querySelectorAll('.sql-exercise').length;
  document.querySelectorAll('.progress[data-progress]').forEach(p => {
    p.innerHTML = `решено <b>${solved.size}</b> / ${total}`;
  });
}

/* ---- widget: playground -------------------------------------------- */
function buildPlayground(host) {
  const starter = grab(host, '.starter');
  host.innerHTML = '';
  host.classList.add('sql-widget');
  const ed = makeEditor(starter || 'SELECT * FROM customers;', Number(host.dataset.height) || 120);
  const bar = el('div', 'sql-toolbar');
  const run = el('button', 'btn primary run-btn'); run.innerHTML = 'Выполнить <span class="kbd">⌘⏎</span>';
  const status = el('div', 'sql-status');
  bar.append(run, status);
  const out = el('div', 'sql-output');
  host.append(ed, bar, out);

  run.addEventListener('click', async () => {
    status.className = 'sql-status'; status.textContent = 'выполняю…';
    try {
      const r = await runMany(ed.value);
      renderTable(out, r.fields, r.rows);
      status.className = 'sql-status ok'; status.textContent = 'готово';
    } catch (e) {
      out.innerHTML = '';
      out.appendChild(el('div', 'sql-message err', 'Ошибка: ' + errorText(e)));
      status.className = 'sql-status err'; status.textContent = 'ошибка';
    }
  });
}

/* ---- widget: exercise ---------------------------------------------- */
function buildExercise(host) {
  const solution = grab(host, '.solution').trim();
  const hint = grab(host, '.hint').trim();
  const starter = grab(host, '.starter');
  const orderMatters = host.dataset.order === 'true';
  const taskNode = host.querySelector('.task');

  host.classList.add('sql-widget');
  const ed = makeEditor(starter || '', 96);

  const bar = el('div', 'sql-toolbar');
  const run = el('button', 'btn primary run-btn'); run.innerHTML = 'Проверить <span class="kbd">⌘⏎</span>';
  const status = el('div', 'sql-status');
  bar.append(run);
  const hideSolution = host.dataset.hideSolution === 'true';
  if (solution && !hideSolution) {
    const sol = el('button', 'btn ghost', 'Показать решение');
    const solWrap = el('div', 'hint-box');
    const det = document.createElement('details');
    const sum = el('summary', null, 'Решение'); det.appendChild(sum);
    const pre = el('pre'); pre.appendChild(el('code', null, solution)); det.appendChild(pre);
    solWrap.appendChild(det); solWrap.style.display = 'none';
    sol.addEventListener('click', () => {
      solWrap.style.display = solWrap.style.display === 'none' ? 'block' : 'none';
      det.open = true;
    });
    bar.append(sol);
    host._solWrap = solWrap;
  }
  bar.append(status);

  const out = el('div', 'sql-output');

  // reassemble in order: task, editor, toolbar, output, (hint), (solution)
  host.innerHTML = '';
  if (taskNode) host.appendChild(taskNode);
  host.append(ed, bar, out);
  if (hint) {
    const hb = el('div', 'hint-box');
    const det = document.createElement('details');
    det.appendChild(el('summary', null, 'Подсказка'));
    det.appendChild(el('p', null, hint));
    hb.appendChild(det);
    host.appendChild(hb);
  }
  if (host._solWrap) host.appendChild(host._solWrap);

  run.addEventListener('click', async () => {
    status.className = 'sql-status'; status.textContent = 'проверяю…';
    out.innerHTML = '';
    let userRes;
    try {
      userRes = await runMany(ed.value);
    } catch (e) {
      out.appendChild(el('div', 'sql-message err', 'SQL-ошибка: ' + errorText(e)));
      status.className = 'sql-status err'; status.textContent = 'ошибка';
      return;
    }
    renderTable(out, userRes.fields, userRes.rows);
    if (!solution) { status.className = 'sql-status ok'; status.textContent = 'выполнено'; return; }

    let expected;
    try { expected = await runOne(solution); }
    catch (e) { out.appendChild(el('div', 'sql-message err', 'Ошибка эталона (сообщи учителю): ' + errorText(e))); return; }

    const verdict = compare(userRes, expected, orderMatters);
    if (verdict.ok) {
      out.appendChild(el('div', 'sql-message ok', '✓ Верно! Результат совпадает с ожидаемым.'));
      status.className = 'sql-status ok'; status.textContent = 'верно';
      const id = host.dataset.num || host.id || Math.random();
      solved.add(id); refreshProgress();
    } else {
      out.appendChild(el('div', 'sql-message err', '✗ Пока не то: ' + verdict.why + ' Сравни свой вывод и попробуй ещё. Есть подсказка и решение.'));
      status.className = 'sql-status err'; status.textContent = 'не верно';
    }
  });
}

/* ---- widget: quiz (multiple choice) -------------------------------- */
function buildQuiz(host) {
  const answer = Number(host.dataset.answer);
  const explain = host.querySelector('.explain');
  const opts = [...host.querySelectorAll('.opt')];
  let done = false;
  opts.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      if (done) return;
      done = true;
      const chosen = i + 1;
      opts[answer - 1].classList.add('correct');
      if (chosen !== answer) btn.classList.add('wrong');
      if (explain) explain.classList.add('show');
    });
  });
}

/* ---- boot ----------------------------------------------------------- */
function bootError(msg) {
  document.querySelectorAll('.sql-playground, .sql-exercise').forEach(h => {
    const n = el('div', 'boot-note err', msg);
    h.appendChild(n);
  });
}
function init() {
  try {
    document.querySelectorAll('.sql-playground').forEach(buildPlayground);
    document.querySelectorAll('.sql-exercise').forEach(buildExercise);
    document.querySelectorAll('.quiz').forEach(buildQuiz);
    refreshProgress();
    // warm up the DB so the first "Run" is instant, and surface load errors early.
    getDb().catch(e => bootError('Не удалось загрузить Postgres (PGlite) с CDN. Нужен интернет. Детали: ' + errorText(e)));
  } catch (e) {
    bootError('Ошибка инициализации движка: ' + errorText(e));
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* reset-db buttons (opt-in) */
document.addEventListener('click', async e => {
  if (e.target && e.target.matches('.reset-db')) {
    e.target.disabled = true;
    const old = e.target.textContent;
    e.target.textContent = 'сбрасываю…';
    try { await resetDatabase(); e.target.textContent = 'база сброшена ✓'; }
    catch (err) { e.target.textContent = 'ошибка сброса'; }
    setTimeout(() => { e.target.textContent = old; e.target.disabled = false; }, 1500);
  }
});
