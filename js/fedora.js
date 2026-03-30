/**
 * fedora.js — Fedora
 * Friendly, warm, general-purpose AI assistant for Llabs03.
 * Powered by Groq (llama-3.1-8b-instant) via server proxy.
 */

const Fedora = (() => {
  const ENDPOINT   = '/api/chat';
  const MAX_TOKENS = 1024;
  const MAX_MSGS   = 40;

  let chatHistory = [];
  let busy        = false;

  const $ = id => document.getElementById(id);

  // ── Terminal context ───────────────────────────────────────
  function terminalContext() {
    const parts = [];
    try {
      if (typeof FileSystem !== 'undefined' && FileSystem.getCwd) {
        const cwd = FileSystem.getCwd(), home = '/home/user';
        parts.push('CWD: ' + (cwd.startsWith(home) ? '~' + cwd.slice(home.length) : cwd));
      }
      if (typeof Commands !== 'undefined' && Commands.getHistory) {
        const h = Commands.getHistory().slice(-8);
        if (h.length) parts.push('Recent commands:\n  ' + h.join('\n  '));
      }
    } catch {}
    return parts.join('\n');
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
    $('btn-glio').addEventListener('click', toggle);
    $('glio-clear-btn').addEventListener('click', () => {
      chatHistory = [];
      $('glio-messages').innerHTML = '';
    });
    $('glio-send-btn').addEventListener('click', send);
    $('glio-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    $('glio-input').addEventListener('input', () => grow($('glio-input')));

    // Welcome message
    bubble('assistant', md(
      'Hey there! 👋 I\'m **Fedora**, your friendly assistant.\n\n' +
      'I\'m here to help with pretty much anything — whether that\'s coding, ' +
      'answering questions, brainstorming ideas, explaining concepts, or just having a chat.\n\n' +
      'What\'s on your mind?'
    ));
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => Fedora.init());