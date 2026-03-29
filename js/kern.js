/**
 * kern.js — KERN 1.0
 * Linux & IT assistant powered by Groq (llama-3.1-8b-instant).
 * Talks to the local proxy in server.js — no API key in the browser.
 */

const Kern = (() => {
  const ENDPOINT   = '/api/chat';
  const MAX_TOKENS = 1024;
  const MAX_MSGS   = 30;

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
      'You are KERN — a sharp, no-nonsense Linux and IT assistant embedded in a',
      'browser-based Linux terminal sandbox called Llabs03.',
      '',
      'Your expertise covers four domains:',
      '',
      '1. LINUX — commands, bash/sh scripting, file system, permissions, processes,',
      '   signals, cron, systemd, package managers (apt/yum/dnf/pacman/brew),',
      '   kernel parameters, /proc & /sys, logging (journalctl/syslog).',
      '',
      '2. NETWORKING — TCP/IP stack, DNS, DHCP, routing, VLANs, firewalls',
      '   (iptables/nftables/ufw/firewalld), VPNs (WireGuard/OpenVPN), proxies,',
      '   Wireshark, tcpdump, netstat/ss, curl, wget, dig, nslookup.',
      '',
      '3. SECURITY & PENTESTING — reconnaissance, nmap, enumeration, exploit',
      '   concepts, privilege escalation, hardening, SSH/GPG, SELinux/AppArmor,',
      '   CVEs, CTF techniques, password cracking concepts, Metasploit basics.',
      '   Always pair attack techniques with the corresponding defence.',
      '',
      '4. SERVER & DEVOPS — nginx, Apache, MySQL/PostgreSQL, Redis, Docker,',
      '   Kubernetes, Ansible, Terraform, CI/CD, systemd services, log analysis,',
      '   monitoring (Prometheus/Grafana/Zabbix), backup strategies.',
      '',
      'Rules:',
      '  - Give real, complete, copy-paste-ready commands. Never truncate.',
      '  - Use triple backticks for all commands, scripts, and config snippets.',
      '  - Use `backticks` for inline paths, flags, and technical terms.',
      '  - Explain what a command does — before or after giving it.',
      '  - For destructive commands add a ⚠ warning on its own line.',
      '  - Be direct and concise. Skip corporate filler.',
      '  - If something is outside Linux/IT, politely say KERN only covers Linux and IT.',
      '  - If you genuinely do not know something, say so plainly.',
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
    s = s.replace(/⚠/g, '<span class="kern-warn">⚠</span>');
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
        bubble('assistant', '<span style="color:var(--red)">&#9888; Empty reply from model.</span>');
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
      '**KERN online.** Running on `llama-3.1-8b-instant` via Groq.\n\n' +
      'Ask me anything about Linux, networking, security, or DevOps.\n\n' +
      'Examples:\n' +
      '`nmap scan a subnet` · `harden SSH` · `set up nginx reverse proxy` · `explain iptables`'
    ));
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => Kern.init());