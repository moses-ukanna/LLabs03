/**
 * fedora.js — Fedora
 * Friendly, warm, general-purpose AI assistant for Llabs03.
 * - Knows full terminal history and output at all times
 * - Automatically jumps in when a command returns an error
 * Powered by Groq (llama-3.1-8b-instant) via server proxy.
 */

const Fedora = (() => {
  const ENDPOINT   = '/api/chat';
  const MAX_TOKENS = 1024;
  const MAX_MSGS   = 40;

  let chatHistory    = [];
  let busy           = false;
  let terminalLog    = []; // full log of {cmd, output, isError}
  let lastErrorTimer = null;

  const STORAGE_KEY_CHAT = 'fedora-chat-history';
  const STORAGE_KEY_LOG  = 'fedora-terminal-log';

  // ── Persist to localStorage ────────────────────────────────
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(chatHistory));
      localStorage.setItem(STORAGE_KEY_LOG,  JSON.stringify(terminalLog));
    } catch {}
  }

  // ── Load from localStorage ─────────────────────────────────
  function load() {
    try {
      const chat = localStorage.getItem(STORAGE_KEY_CHAT);
      const log  = localStorage.getItem(STORAGE_KEY_LOG);
      if (chat) chatHistory = JSON.parse(chat);
      if (log)  terminalLog = JSON.parse(log);
    } catch {}
  }

  const $ = id => document.getElementById(id);

  // ── Called by terminal.js after every command ──────────────
  function onCommand(cmd, output, isError) {
    terminalLog.push({ cmd, output: output || '', isError: !!isError });
    if (terminalLog.length > 40) terminalLog = terminalLog.slice(-40);
    save();

    if (isError) {
      // Small delay so terminal output renders first
      clearTimeout(lastErrorTimer);
      lastErrorTimer = setTimeout(() => {
        autoHelp(cmd, output);
      }, 600);
    }
  }

  // ── Auto open panel and offer help on error ────────────────
  async function autoHelp(cmd, errorOutput) {
    if (busy) return;

    // Open panel if not already open
    const panel = $('glio-panel');
    if (!panel.classList.contains('open')) {
      panel.classList.add('open');
      $('btn-glio').classList.add('active');
    }

    const prompt = `The user just ran this command in the terminal:\n\`${cmd}\`\n\nIt returned this error:\n${errorOutput}\n\nBriefly explain what went wrong and how to fix it. Be friendly and concise.`;

    bubble('assistant', md('💡 Looks like that command hit an error — let me help...'));

    chatHistory.push({ role: 'user', content: prompt });
    if (chatHistory.length > MAX_MSGS) chatHistory = chatHistory.slice(-MAX_MSGS);

    busy = true;
    typing(true);

    try {
      const res = await fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: MAX_TOKENS,
          system:     systemPrompt(),
          messages:   chatHistory,
        }),
      });

      typing(false);

      const raw = await res.text();
      let data;
      try { data = raw ? JSON.parse(raw) : null; } catch { return; }
      if (!res.ok || !data) return;

      const reply = (data.content || [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');

      if (reply) {
        bubble('assistant', md(reply));
        chatHistory.push({ role: 'assistant', content: reply });
        if (chatHistory.length > MAX_MSGS) chatHistory = chatHistory.slice(-MAX_MSGS);
        save();
      }
    } catch (e) {
      typing(false);
    } finally {
      busy = false;
      $('glio-send-btn').disabled = false;
    }
  }

  // ── Terminal context snapshot ──────────────────────────────
  function terminalContext() {
    const parts = [];
    try {
      if (typeof FileSystem !== 'undefined' && FileSystem.getCwd) {
        const cwd = FileSystem.getCwd(), home = '/home/user';
        parts.push('CWD: ' + (cwd.startsWith(home) ? '~' + cwd.slice(home.length) : cwd));
      }
    } catch {}

    // Last 12 commands with their output
    if (terminalLog.length) {
      const recent = terminalLog.slice(-12);
      const lines = recent.map(e =>
        `$ ${e.cmd}${e.output ? '\n  ' + e.output.slice(0, 200) : ''}${e.isError ? ' [ERROR]' : ''}`
      );
      parts.push('Terminal history:\n' + lines.join('\n'));
    }

    return parts.join('\n\n');
  }

  // ── System prompt ──────────────────────────────────────────
  function systemPrompt() {
    const ctx = terminalContext();
    const base = [
      'You are Fedora — a warm, friendly, and deeply knowledgeable AI assistant',
      'embedded in Llabs03, a browser-based Linux terminal sandbox.',
      '',
      'Your personality:',
      '  - Warm and friendly — you genuinely enjoy helping people.',
      '  - Approachable — you never make anyone feel silly for asking something.',
      '  - Natural — you talk like a real person, not a robot.',
      '  - Encouraging — you celebrate curiosity and learning.',
      '  - Honest — if you don\'t know something, you say so openly.',
      '',
      'Your knowledge covers everything:',
      '  - Technology, programming, Linux, cybersecurity, networking',
      '  - Science, mathematics, physics, chemistry, biology, medicine',
      '  - History, geography, politics, economics, law, philosophy',
      '  - Arts, music, literature, film, culture, sports',
      '  - Everyday life — cooking, travel, relationships, health, finance',
      '  - Creative writing, brainstorming, problem solving',
      '',
      'You can see the user\'s full terminal session including every command they',
      'have run and the output. Use this context to give relevant, accurate help.',
      '',
      'How you respond:',
      '  - Keep responses conversational and natural.',
      '  - Use **bold** for emphasis and `backticks` for code or technical terms.',
      '  - Use triple backticks for multi-line code blocks.',
      '  - Be concise but complete — never pad responses unnecessarily.',
      '  - Ask follow-up questions when it helps you give a better answer.',
      '  - Never be condescending or overly formal.',
    ].join('\n');

    return ctx ? base + '\n\n--- Terminal Session ---\n' + ctx : base;
  }

  // ── Minimal markdown → safe HTML ──────────────────────────
  function md(text) {
    let s = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const blocks = [];
    s = s.replace(/```[^\n]*\n?([\s\S]*?)```/g, (_, code) => {
      blocks.push('<pre><code>' + code.trimEnd() + '</code></pre>');
      return '\x00BLOCK' + (blocks.length - 1) + '\x00';
    });

    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\n/g, '<br>');
    s = s.replace(/\x00BLOCK(\d+)\x00/g, (_, i) => blocks[+i]);

    return s;
  }

  // ── Bubbles ────────────────────────────────────────────────
  function bubble(role, html) {
    const msgs = $('glio-messages');
    const el   = document.createElement('div');
    el.className = 'glio-msg ' + role;
    el.innerHTML = html;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  function typing(show) {
    $('glio-typing').style.display = show ? 'flex' : 'none';
    $('glio-messages').scrollTop = $('glio-messages').scrollHeight;
  }

  // ── Send ───────────────────────────────────────────────────
  async function send() {
    if (busy) return;
    const inp  = $('glio-input');
    const text = inp.value.trim();
    if (!text) return;

    bubble('user', md(text));
    chatHistory.push({ role: 'user', content: text });
    if (chatHistory.length > MAX_MSGS) chatHistory = chatHistory.slice(-MAX_MSGS);

    inp.value = '';
    inp.style.height = 'auto';
    $('glio-send-btn').disabled = true;
    busy = true;
    typing(true);

    try {
      const res = await fetch(ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: MAX_TOKENS,
          system:     systemPrompt(),
          messages:   chatHistory,
        }),
      });

      typing(false);

      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        bubble('assistant',
          '<span style="color:var(--red)">&#9888; Unreadable server response' +
          (raw ? ': ' + raw.slice(0, 120) : ' (empty body)') + '</span>');
        return;
      }

      if (!res.ok || !data) {
        const msg = (data && data.error && (data.error.message || data.error)) || ('HTTP ' + res.status);
        bubble('assistant', '<span style="color:var(--red)">&#9888; ' + msg + '</span>');
        return;
      }

      const reply = (data.content || [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');

      if (!reply) {
        bubble('assistant', '<span style="color:var(--red)">&#9888; Empty reply — try again.</span>');
        return;
      }

      bubble('assistant', md(reply));
      chatHistory.push({ role: 'assistant', content: reply });
      if (chatHistory.length > MAX_MSGS) chatHistory = chatHistory.slice(-MAX_MSGS);
      save();

    } catch (e) {
      typing(false);
      bubble('assistant',
        '<span style="color:var(--red)">&#9888; ' + (e.message || 'Network error') + '</span>');
    } finally {
      busy = false;
      $('glio-send-btn').disabled = false;
      inp.focus();
    }
  }

  // ── Panel toggle ───────────────────────────────────────────
  function toggle() {
    const p    = $('glio-panel');
    const open = p.classList.toggle('open');
    $('btn-glio').classList.toggle('active', open);
    if (open) setTimeout(() => $('glio-input').focus(), 260);
  }

  function grow(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    // Load persisted state
    load();

    $('btn-glio').addEventListener('click', toggle);
    $('glio-clear-btn').addEventListener('click', () => {
      chatHistory = [];
      terminalLog = [];
      $('glio-messages').innerHTML = '';
      try {
        localStorage.removeItem('fedora-chat-history');
        localStorage.removeItem('fedora-terminal-log');
      } catch {}
    });
    $('glio-send-btn').addEventListener('click', send);
    $('glio-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    $('glio-input').addEventListener('input', () => grow($('glio-input')));

    bubble('assistant', md(
      'Hey there! 👋 I\'m **Fedora**, your friendly assistant.\n\n' +
      'I can see everything you type in the terminal and I\'ll jump in automatically if something goes wrong. ' +
      'You can also ask me anything anytime.\n\n' +
      'What\'s on your mind?'
    ));
  }

  return { init, onCommand };
})();

document.addEventListener('DOMContentLoaded', () => Fedora.init());