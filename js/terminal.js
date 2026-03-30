/**
 * terminal.js — Llabs03 v2
 * Depends on: filesystem.js, commands.js
 */

// ── Terminal ──────────────────────────────────────────────────────────
const Terminal = (() => {
  let outputEl, inputEl, promptEl;
  let histIndex = -1, savedInput = '';
  let cmdCount = 0;

  const STORAGE_KEY_CMDS  = 'llabs03-cmd-history';
  const STORAGE_KEY_COUNT = 'llabs03-cmd-count';

  function saveTerminal() {
    try {
      const h = Commands.getHistory ? Commands.getHistory() : [];
      localStorage.setItem(STORAGE_KEY_CMDS,  JSON.stringify(h));
      localStorage.setItem(STORAGE_KEY_COUNT, String(cmdCount));
    } catch {}
  }

  function loadTerminal() {
    try {
      const count = localStorage.getItem(STORAGE_KEY_COUNT);
      if (count) {
        cmdCount = parseInt(count, 10) || 0;
        const el = document.getElementById('rail-cmd-count');
        if (el) el.textContent = cmdCount + ' CMD';
      }
    } catch {}
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function promptHTML() {
    const full = FileSystem.getCwd();
    const home = '/home/user';
    const display = full.startsWith(home) ? '~' + full.slice(home.length) : full;
    return `<span class="prompt-user">user@llabs03</span>`
         + `<span class="prompt-sep">:</span>`
         + `<span class="prompt-path">${escHtml(display)}</span>`
         + `<span class="prompt-dollar"> $</span>`;
  }

  function updatePrompt() {
    promptEl.innerHTML = promptHTML();
    const full = FileSystem.getCwd();
    const home = '/home/user';
    const display = full.startsWith(home) ? '~' + full.slice(home.length) : full;
    const el = document.getElementById('hdr-cwd');
    if (el) el.textContent = display || '~';
  }

  function print(content, type = 'normal') {
    const el = document.createElement('div');
    el.className = 'output-line ' + type;
    if (type === 'ls-output' && Array.isArray(content)) {
      el.innerHTML = content.map(({ name, isDir, isExe }) =>
        isDir
          ? `<span class="ls-dir">${escHtml(name)}/</span>`
          : isExe
            ? `<span class="ls-exe">${escHtml(name)}</span>`
            : `<span class="ls-file">${escHtml(name)}</span>`
      ).join('  ');
    } else {
      el.textContent = content;
    }
    outputEl.appendChild(el);
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function echoCommand(cmdText) {
    const el = document.createElement('div');
    el.className = 'output-line prompt-echo';
    el.innerHTML = promptHTML() + ` <span class="prompt-cmd">${escHtml(cmdText)}</span>`;
    outputEl.appendChild(el);
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function updateCmdCount() {
    cmdCount++;
    const el = document.getElementById('rail-cmd-count');
    if (el) el.textContent = `${cmdCount} CMD`;
    saveTerminal();
  }

  // ── Pipeline ──────────────────────────────────────────────────────────
  function splitPipe(line) {
    const segs = []; let cur = '', inQ = false, qc = '';
    for (const ch of line) {
      if (inQ) { cur += ch; if (ch === qc) inQ = false; }
      else if (ch === '"' || ch === "'") { inQ = true; qc = ch; cur += ch; }
      else if (ch === '|') { segs.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    if (cur.trim()) segs.push(cur.trim());
    return segs;
  }

  function extractRedirect(seg) {
    let m = seg.match(/^(.*?)>>(.*?)$/s);
    if (m) return { cmd: m[1].trim(), file: m[2].trim(), append: true };
    m = seg.match(/^(.*?)>(.*?)$/s);
    if (m) return { cmd: m[1].trim(), file: m[2].trim(), append: false };
    return { cmd: seg, file: null, append: false };
  }

  function tokenise(str) {
    const tokens = []; let tok = '', inQ = false, qc = '';
    for (const ch of str) {
      if (inQ) { if (ch === qc) inQ = false; else tok += ch; }
      else if (ch === '"' || ch === "'") { inQ = true; qc = ch; }
      else if (ch === ' ') { if (tok) { tokens.push(tok); tok = ''; } }
      else tok += ch;
    }
    if (tok) tokens.push(tok);
    return { name: tokens[0] || '', args: tokens.slice(1) };
  }

  function executeSegment(seg, stdin) {
    const { cmd: segCmd, file, append } = extractRedirect(seg);
    let { name, args } = tokenise(segCmd);
    if (!name) return { output: '', file, append };
    const resolved = Commands.resolveAlias(name);
    if (resolved !== name) {
      const { name: rName, args: rArgs } = tokenise(resolved);
      name = rName; args = [...rArgs, ...args];
    }
    return { ...Commands.execute(name, args, stdin), file, append };
  }

  function runPipeline(line) {
    const segs = splitPipe(line);
    let stdin;
    for (let i = 0; i < segs.length; i++) {
      const isLast = i === segs.length - 1;
      const res = executeSegment(segs[i], stdin);
      if (res.clear) { outputEl.innerHTML = ''; return; }
      if (res.file) {
        const content = (res.output || '') + (res.output && !res.output.endsWith('\n') ? '\n' : '');
        FileSystem.writeFile(res.file, content, res.append);
        stdin = undefined;
      } else if (!isLast) {
        stdin = res.output || '';
      } else {
        if (res.colorNames) print(res.colorNames, 'ls-output');
        else if (res.output != null && res.output !== '') print(res.output, res.isError ? 'error' : 'normal');
        // Notify Fedora of command result
        if (isLast && typeof Fedora !== 'undefined' && Fedora.onCommand) {
          try { Fedora.onCommand(segs[i].trim(), res.output || '', !!res.isError); } catch {}
        }
      }
    }
  }

  function runLine(rawLine) {
    const line = rawLine.trim();
    if (!line) return;
    Commands.addHistory(line);
    echoCommand(line);
    updateCmdCount();

    const subCmds = []; let cur = '', inQ = false, qc = '';
    for (const ch of line) {
      if (inQ) { cur += ch; if (ch === qc) inQ = false; }
      else if (ch === '"' || ch === "'") { inQ = true; qc = ch; cur += ch; }
      else if (ch === ';') { if (cur.trim()) subCmds.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    if (cur.trim()) subCmds.push(cur.trim());

    for (const sub of subCmds) {
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(sub) && !sub.includes(' ')) {
        Commands.execute('export', [sub]); continue;
      }
      runPipeline(sub);
    }
    updatePrompt();
    UI.onCommand();
  }

  function handleTab() {
    const val = inputEl.value;
    const parts = val.trimStart().split(' ');
    const last = parts[parts.length - 1];
    if (!last) return;
    const completions = FileSystem.getCompletions(last);
    if (completions.length === 1) {
      parts[parts.length - 1] = completions[0];
      inputEl.value = parts.join(' ');
    } else if (completions.length > 1) {
      echoCommand(val);
      print(completions.join('  '));
    }
  }

  return {
    init(outEl, inEl, prEl) {
      outputEl = outEl; inputEl = inEl; promptEl = prEl;
      updatePrompt();

      print('╔══════════════════════════════════════════════════════════╗', 'info');
      print('║           Llabs03 — Linux Terminal Sandbox v3            ║', 'info');
      print('║   70+ commands · Full filesystem · Three themes          ║', 'info');
      print('║   Realistic /etc /var /proc /boot /dev /usr content      ║', 'info');
      print('╚══════════════════════════════════════════════════════════╝', 'info');
      print('');
      print('Type  help  for all commands.  Type  man <cmd>  for details.', 'hint');
      print('Try:  ls /  ·  cat /etc/passwd  ·  sudo cat /etc/shadow', 'hint');
      print('');

      inputEl.addEventListener('keydown', e => {
        const history = Commands.getHistory();
        switch (e.key) {
          case 'Enter': {
            if (e.shiftKey) return;
            e.preventDefault();
            const val = inputEl.value;
            inputEl.value = ''; histIndex = -1; savedInput = '';
            inputEl.rows = 1;
            runLine(val);
            break;
          }
          case 'Tab': e.preventDefault(); handleTab(); break;
          case 'ArrowUp':
            if (inputEl.selectionStart > inputEl.value.indexOf('\n') && inputEl.value.includes('\n')) break;
            e.preventDefault();
            if (histIndex === -1) savedInput = inputEl.value;
            if (histIndex < history.length - 1) { histIndex++; inputEl.value = history[history.length - 1 - histIndex]; }
            setTimeout(() => inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length), 0);
            break;
          case 'ArrowDown':
            if (inputEl.value.includes('\n') && inputEl.selectionStart < inputEl.value.lastIndexOf('\n')) break;
            e.preventDefault();
            if (histIndex > 0) { histIndex--; inputEl.value = history[history.length - 1 - histIndex]; }
            else if (histIndex === 0) { histIndex = -1; inputEl.value = savedInput; }
            setTimeout(() => inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length), 0);
            break;
          case 'l': if (e.ctrlKey) { e.preventDefault(); outputEl.innerHTML = ''; } break;
          case 'c': if (e.ctrlKey) { e.preventDefault(); echoCommand(inputEl.value + '^C'); inputEl.value = ''; histIndex = -1; } break;
          case 'u': if (e.ctrlKey) { e.preventDefault(); inputEl.value = ''; } break;
        }
      });

      document.addEventListener('click', (e) => {
        if (
          !e.target.closest('.input-resize-handle') &&
          !e.target.closest('.mode-rail') &&
          !e.target.closest('.glio-panel') &&
          !e.target.closest('.sidebar')
        ) inputEl.focus();
      });
      inputEl.focus();
    },
    print, updatePrompt,
    clear() { outputEl.innerHTML = ''; }
  };
})();

// ── Theme Manager ──────────────────────────────────────────────────────
const ThemeManager = (() => {
  const THEME_KEY = 'llabs03-theme';

  const MOON_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 10A6 6 0 016 2.5a6 6 0 100 11 6 6 0 007.5-3.5z"/></svg>`;
  const SUN_SVG  = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="3.5" y1="3.5" x2="5" y2="5"/><line x1="11" y1="11" x2="12.5" y2="12.5"/><line x1="12.5" y1="3.5" x2="11" y2="5"/><line x1="5" y1="11" x2="3.5" y2="12.5"/></svg>`;

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const iconEl  = document.getElementById('theme-icon-svg');
    const labelEl = document.getElementById('theme-label');
    if (iconEl)  iconEl.outerHTML = `<span id="theme-icon-svg">${theme === 'dark' ? MOON_SVG : SUN_SVG}</span>`;
    if (labelEl) labelEl.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }

  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    let saved = 'dark';
    try { saved = localStorage.getItem(THEME_KEY) || 'dark'; } catch {}
    if (saved !== 'light') saved = 'dark';
    apply(saved);
    const btn = document.getElementById('btn-theme');
    if (btn) btn.addEventListener('click', toggle);
  }

  return { init, apply };
})();

// ── Input Resizer ──────────────────────────────────────────────────────
const InputResizer = (() => {
  const MIN_H = 38, MAX_H = 300;
  function init() {
    const handle = document.getElementById('input-resize-handle');
    const area = document.getElementById('input-area');
    const badge = document.getElementById('input-size-badge');
    const inp = document.getElementById('input');
    if (!handle || !area) return;
    let dragging = false, startY = 0, startH = 0;
    function showBadge(h) { const rows = Math.max(1, Math.round((h - 12) / 21.5)); badge.textContent = `${rows} row${rows !== 1 ? 's' : ''}`; badge.classList.add('visible'); }
    function hideBadge() { badge.classList.remove('visible'); }
    handle.addEventListener('mousedown', e => { e.preventDefault(); dragging = true; startY = e.clientY; startH = area.offsetHeight; handle.classList.add('dragging'); document.body.style.cursor = 'ns-resize'; document.body.style.userSelect = 'none'; showBadge(startH); });
    document.addEventListener('mousemove', e => { if (!dragging) return; const newH = Math.min(MAX_H, Math.max(MIN_H, startH + (startY - e.clientY))); area.style.height = newH + 'px'; inp.style.height = (newH - 20) + 'px'; showBadge(newH); });
    document.addEventListener('mouseup', () => { if (!dragging) return; dragging = false; handle.classList.remove('dragging'); document.body.style.cursor = ''; document.body.style.userSelect = ''; setTimeout(hideBadge, 800); inp.focus(); });
    handle.addEventListener('touchstart', e => { e.preventDefault(); dragging = true; startY = e.touches[0].clientY; startH = area.offsetHeight; handle.classList.add('dragging'); showBadge(startH); }, { passive: false });
    document.addEventListener('touchmove', e => { if (!dragging) return; const newH = Math.min(MAX_H, Math.max(MIN_H, startH + (startY - e.touches[0].clientY))); area.style.height = newH + 'px'; inp.style.height = (newH - 20) + 'px'; showBadge(newH); }, { passive: false });
    document.addEventListener('touchend', () => { if (!dragging) return; dragging = false; handle.classList.remove('dragging'); setTimeout(hideBadge, 800); inp.focus(); });
  }
  return { init };
})();

// ── Live Clock ─────────────────────────────────────────────────────────
const Clock = (() => {
  function init() {
    const el = document.getElementById('rail-clock');
    if (!el) return;
    function tick() {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    tick();
    setInterval(tick, 10000);
  }
  return { init };
})();


// ── UI / Mode Manager ──────────────────────────────────────────────────
const UI = (() => {
  let currentMode = 'terminal';
  const MODES = {
    terminal:  { label: 'TERMINAL',   sidebar: false, split: false },
    explorer:  { label: 'EXPLORER',   sidebar: true,  split: false },
    reference: { label: 'REFERENCE',  sidebar: true,  split: false },
    split:     { label: 'SPLIT VIEW', sidebar: false, split: true  },
  };
  const REF_DATA = [
    { group: 'Navigate',  cmds: [['pwd','cwd'],['ls -la','list'],['cd <d>','change dir'],['find','search'],['stat','file info']] },
    { group: 'Files',     cmds: [['touch','create'],['mkdir -p','make dir'],['rm -rf','delete'],['cp -r / mv','copy/move'],['chmod/chown','perms']] },
    { group: 'Content',   cmds: [['cat -n','read'],['echo > >>','write'],['head/tail','slice'],['diff','compare'],['nano','edit']] },
    { group: 'Text',      cmds: [['grep -rinv','search'],['sed','replace'],['awk -F','extract'],['sort/uniq','sort'],['cut/tr','transform'],['wc -lwc','count']] },
    { group: 'Crypto',    cmds: [['base64 -d','encode'],['md5sum','hash'],['sha256sum','hash'],['xxd','hexdump']] },
    { group: 'Network',   cmds: [['ping','icmp'],['curl -I','http'],['wget','download'],['ip addr','interfaces'],['ss','sockets']] },
    { group: 'System',    cmds: [['ps aux','procs'],['systemctl','services'],['apt','packages'],['sudo','root'],['uname -a','sys info']] },
    { group: 'Shell',     cmds: [['|','pipe'],['> >>','redirect'],['cmd;cmd','chain'],['alias','shortcuts'],['history','recall']] },
  ];

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function buildTree(container, maxDepth = 2) {
    container.innerHTML = '';
    const cwd = FileSystem.getCwd();
    function renderNode(name, node, depth, absPath) {
      const isDir = node.type === 'dir', isCwd = absPath === cwd;
      const el = document.createElement('div');
      el.className = `fs-node ${isDir ? 'dir' : 'file'}${isCwd ? ' cwd' : ''}`;
      for (let i = 0; i < depth; i++) { const sp = document.createElement('span'); sp.className = 'fs-indent'; sp.textContent = i === depth - 1 ? '├ ' : '│ '; el.appendChild(sp); }
      const icon = document.createElement('span'); icon.className = 'fs-icon'; icon.textContent = isDir ? (isCwd ? '▶' : '▸') : '·'; el.appendChild(icon);
      const nm = document.createElement('span'); nm.className = 'fs-name'; nm.textContent = name + (isDir ? '/' : ''); el.appendChild(nm);
      if (isDir) { el.title = `cd ${absPath}`; el.addEventListener('click', e => { e.stopPropagation(); FileSystem.changeDir(absPath); Terminal.updatePrompt(); refreshTrees(); }); }
      container.appendChild(el);
      if (isDir && depth < maxDepth && node.children) {
        Object.entries(node.children).sort(([,a],[,b]) => a.type === b.type ? 0 : a.type === 'dir' ? -1 : 1)
          .forEach(([n, nd]) => renderNode(n, nd, depth + 1, `${absPath}/${n}`.replace('//', '/')));
      }
    }
    const root = FileSystem.getNode('/');
    ['home','root','etc','var','tmp','usr','bin','sbin','dev','proc','boot','opt','srv','mnt','media'].forEach(name => {
      if (root.children[name]) renderNode(name, root.children[name], 0, `/${name}`);
    });
  }

  function buildRef(container) {
    container.innerHTML = '';
    REF_DATA.forEach(({ group, cmds }) => {
      const lbl = document.createElement('span'); lbl.className = 'ref-group-label'; lbl.textContent = group; container.appendChild(lbl);
      cmds.forEach(([name, desc]) => { const row = document.createElement('div'); row.className = 'cmd-ref'; row.innerHTML = `<span class="cmd-name">${escHtml(name)}</span><span>${escHtml(desc)}</span>`; container.appendChild(row); });
    });
    const tip = document.createElement('div'); tip.className = 'ref-tip'; tip.textContent = '↑↓ history · Tab autocomplete · Ctrl+L clear'; container.appendChild(tip);
  }

  function applyMode(mode) {
    currentMode = mode;
    const cfg = MODES[mode] || MODES.terminal;
    const sidebar = document.getElementById('sidebar'), split = document.getElementById('split-panel');
    sidebar.classList.toggle('visible', cfg.sidebar);
    split.classList.toggle('visible', cfg.split);
    document.querySelectorAll('.layout-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    // Update hdr-mode label if present
    const modeLbl = document.getElementById('hdr-mode');
    if (modeLbl) modeLbl.textContent = cfg.label;
    sidebar.innerHTML = '';
    if (mode === 'explorer') {
      const sec = document.createElement('div'); sec.className = 'sidebar-section'; sec.innerHTML = '<div class="sidebar-title">// Filesystem</div>';
      const tree = document.createElement('div'); tree.className = 'fs-tree'; tree.id = 'sidebar-tree'; sec.appendChild(tree); sidebar.appendChild(sec); buildTree(tree, 3);
    } else if (mode === 'reference') {
      const sec = document.createElement('div'); sec.className = 'sidebar-section'; sec.innerHTML = '<div class="sidebar-title">// Commands</div>';
      const ref = document.createElement('div'); buildRef(ref); sec.appendChild(ref); sidebar.appendChild(sec);
    }
    if (mode === 'split') {
      const st = document.getElementById('split-tree'), sr = document.getElementById('split-ref');
      if (st) buildTree(st, 2); if (sr) buildRef(sr); refreshSplitCwd();
    }
  }

  function refreshSplitCwd() { const el = document.getElementById('split-cwd-label'); if (!el) return; const f = FileSystem.getCwd(), h = '/home/user'; el.textContent = f.startsWith(h) ? '~' + f.slice(h.length) : f; }
  function refreshTrees() {
    if (currentMode === 'explorer') { const t = document.getElementById('sidebar-tree'); if (t) buildTree(t, 3); }
    if (currentMode === 'split') { const t = document.getElementById('split-tree'); if (t) buildTree(t, 2); refreshSplitCwd(); }
  }

  function bindEvents() {
    document.querySelectorAll('.layout-btn').forEach(btn => btn.addEventListener('click', () => {
      applyMode(btn.dataset.mode);
    }));
    document.getElementById('btn-reset').addEventListener('click', () => {
      FileSystem.reset();
      Terminal.updatePrompt();
      Terminal.print('');
      Terminal.print('Filesystem reset — all files cleared.', 'info');
      Terminal.print('');
      refreshTrees();
    });
    document.getElementById('btn-clear').addEventListener('click', () => {
      Terminal.clear();
    });
  }

  return {
    init() { bindEvents(); applyMode('terminal'); },
    onCommand() { refreshTrees(); }
  };
})();

// ── Bootstrap ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  Terminal.init(document.getElementById('output'), document.getElementById('input'), document.getElementById('prompt'));
  ThemeManager.init();
  InputResizer.init();
  Clock.init();
  UI.init();
});