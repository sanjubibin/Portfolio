(() => {
  'use strict';

  const CONFIG = window.CONFIG;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const cliBtn      = $('#cli-nav-btn');
  const cliTerminal = $('#cli-terminal');
  const cliClose    = $('#cli-terminal-close');
  const cliOutput   = $('#cli-terminal-output');

  if (!cliBtn || !cliTerminal || !cliClose || !cliOutput) {
    console.warn('CLI Console elements missing — console functionality disabled.');
    return;
  }

  // Active input element (changes every time a new prompt is created)
  let cliInput = null;

  let isPythonRepl = false;

  // Shell history persists across visits — like a real dotfile setup.
  const HISTORY_KEY = 'cli-shell-history';
  let shellHistory = [];
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
    if (Array.isArray(saved)) shellHistory = saved;
  } catch (e) { /* fresh shell */ }
  let shellHistoryIndex = -1;
  const pythonHistory = [];
  let pythonHistoryIndex = -1;

  // Initialize terminal title bar text dynamically from configuration settings
  const titleEl = $('.cli-terminal__title');
  if (titleEl) {
    const username = (CONFIG.terminalPrompt && CONFIG.terminalPrompt.username) || 'visitor';
    const hostname = (CONFIG.terminalPrompt && CONFIG.terminalPrompt.hostname) || 'portfolio';
    titleEl.textContent = `${username}@${hostname}: ~`;
  }

  // ------------------------------------------------------------- append helpers

  function logOutput(html) {
    const line = document.createElement('div');
    line.className = 'cli-terminal__line';
    line.innerHTML = html;
    cliOutput.appendChild(line);
    scrollBottom();
  }

  function scrollBottom() {
    cliOutput.scrollTop = cliOutput.scrollHeight;
  }

  // A lightweight, regex-based Python syntax highlighter for terminal logs
  function highlightPython(code) {
    const placeholders = [];
    let temp = esc(code);

    // 1. Comments
    temp = temp.replace(/(#.*)$/g, (match) => {
      const id = `___PY_TOKEN_COMMENT_${placeholders.length}___`;
      placeholders.push({ id, html: `<span style="color:var(--cli-comment); font-style:italic;">${match}</span>` });
      return id;
    });

    // 2. Strings
    temp = temp.replace(/("(?:\\"|[^"])*"|'(?:\\'|[^'])*')/g, (match) => {
      const id = `___PY_TOKEN_STRING_${placeholders.length}___`;
      placeholders.push({ id, html: `<span style="color:var(--cli-green);">${match}</span>` });
      return id;
    });

    // 3. Keywords
    const keywords = [
      'def', 'class', 'import', 'from', 'as', 'return', 'yield',
      'if', 'elif', 'else', 'for', 'while', 'in', 'is', 'and', 'or', 'not',
      'try', 'except', 'finally', 'with', 'assert', 'break', 'continue',
      'pass', 'global', 'nonlocal', 'del', 'raise', 'lambda'
    ];
    const keywordsRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    temp = temp.replace(keywordsRegex, (match) => {
      const id = `___PY_TOKEN_KEY_${placeholders.length}___`;
      placeholders.push({ id, html: `<span style="color:var(--cli-purple); font-weight:700;">${match}</span>` });
      return id;
    });

    // 4. Builtins
    const builtins = [
      'True', 'False', 'None', 'self', 'print', 'len', 'range',
      'str', 'int', 'dict', 'list', 'set', 'float', 'type', 'dir', 'vars',
      'append', 'split', 'join', 'replace'
    ];
    const builtinsRegex = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
    temp = temp.replace(builtinsRegex, (match) => {
      const id = `___PY_TOKEN_BUILT_${placeholders.length}___`;
      placeholders.push({ id, html: `<span style="color:var(--cli-blue); font-weight:600;">${match}</span>` });
      return id;
    });

    // 5. Functions
    temp = temp.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/g, (match) => {
      const id = `___PY_TOKEN_FUNC_${placeholders.length}___`;
      placeholders.push({ id, html: `<span style="color:var(--cli-amber);">${match}</span>` });
      return id;
    });

    // 6. Numbers
    temp = temp.replace(/\b(\d+(?:\.\d+)?)\b/g, (match) => {
      const id = `___PY_TOKEN_NUM_${placeholders.length}___`;
      placeholders.push({ id, html: `<span style="color:var(--cli-orange);">${match}</span>` });
      return id;
    });

    // 7. Expand all placeholders in reverse order
    for (let i = placeholders.length - 1; i >= 0; i--) {
      temp = temp.replace(placeholders[i].id, placeholders[i].html);
    }

    return temp;
  }

  // ------------------------------------------------------------- create prompt
  // Appends a new live input-line at the bottom of the output stream
  function createPrompt() {
    const wrapper = document.createElement('div');
    wrapper.className = 'cli-terminal__input-line';

    const promptSpan = document.createElement('span');
    promptSpan.className = 'cli-terminal__prompt';
    
    if (isPythonRepl) {
      promptSpan.textContent = pyBuffer.length ? '... ' : '>>> ';
      promptSpan.style.color = 'var(--cli-blue)';
    } else {
      const username = (CONFIG.terminalPrompt && CONFIG.terminalPrompt.username) || 'visitor';
      const hostname = (CONFIG.terminalPrompt && CONFIG.terminalPrompt.hostname) || 'portfolio';
      promptSpan.innerHTML = `<span style="color:var(--cli-green); font-weight:bold;">${esc(username)}@${esc(hostname)}</span>:<span style="color:var(--cli-link); font-weight:bold;">~</span>$`;
      promptSpan.style.color = '';
    }

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'cli-terminal__input-wrapper';

    const overlay = document.createElement('div');
    overlay.className = 'cli-terminal__overlay';

    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Terminal Input');
    input.placeholder = isPythonRepl
      ? (pyBuffer.length ? 'continue the block — empty line runs it' : 'e.g. print(2 + 2)')
      : "type 'help' to see commands...";
    input.className = 'cli-terminal__live-input';

    inputWrapper.appendChild(overlay);
    inputWrapper.appendChild(input);
    wrapper.appendChild(promptSpan);
    wrapper.appendChild(inputWrapper);
    cliOutput.appendChild(wrapper);

    // Synchronize horizontal scrolling
    input.addEventListener('scroll', () => {
      overlay.scrollLeft = input.scrollLeft;
    });

    // Real-time syntax highlighting
    const updateOverlay = () => {
      const val = input.value;
      if (!val) {
        overlay.innerHTML = '';
        return;
      }
      if (isPythonRepl) {
        overlay.innerHTML = highlightPython(val);
      } else {
        const commandRegex = COMMAND_REGEX; // derived from the registry
        if (commandRegex.test(val)) {
          overlay.innerHTML = val.replace(commandRegex, '<span style="color:var(--cli-purple); font-weight:bold;">$1</span>');
        } else {
          overlay.textContent = val;
        }
      }
    };

    input.addEventListener('input', updateOverlay);

    // Wire up terminal key events on this new input
    input.addEventListener('keydown', (e) => {
      // 1. Intercept Ctrl+Z (SIGTSTP) to leave interactive shells
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (isPythonRepl) {
          isPythonRepl = false;
          pyBuffer = [];
          inputWrapper.remove();
          const typed = document.createElement('span');
          typed.textContent = ' ^Z';
          typed.style.color = 'var(--ink-hi)';
          typed.style.fontFamily = 'var(--font-code)';
          typed.style.fontSize = '0.9rem';
          wrapper.appendChild(typed);
          logOutput('Exiting Python REPL (SIGTSTP).');
          createPrompt();
        }
        return;
      }

      // Ctrl+L: clear the screen but keep the current prompt line
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        Array.from(cliOutput.children).forEach((child) => {
          if (child !== wrapper) child.remove();
        });
        return;
      }

      // Ctrl+C at an idle REPL prompt: abort the pending multi-line block
      // (the busy-interrupt case is handled by the window-level listener)
      if (e.ctrlKey && e.key.toLowerCase() === 'c' && isPythonRepl &&
          !(window.PyRuntime && window.PyRuntime.busy()) &&
          !String(window.getSelection ? getSelection() : '').length) {
        e.preventDefault();
        pyBuffer = [];
        inputWrapper.remove();
        const typed = document.createElement('span');
        typed.textContent = `${input.value}^C`;
        typed.style.color = 'var(--ink-hi)';
        typed.style.fontFamily = 'var(--font-code)';
        typed.style.fontSize = '0.9rem';
        wrapper.appendChild(typed);
        logOutput('KeyboardInterrupt');
        createPrompt();
        return;
      }

      // Tab: complete commands/arguments in shell mode; indent in REPL mode
      if (e.key === 'Tab') {
        e.preventDefault();
        if (isPythonRepl) {
          const start = input.selectionStart;
          const end = input.selectionEnd;
          input.value = input.value.substring(0, start) + '    ' + input.value.substring(end);
          input.setSelectionRange(start + 4, start + 4);
          updateOverlay();
          return;
        }
        const val = input.value;
        const parts = val.split(/\s+/).filter(Boolean);
        const trailingSpace = /\s$/.test(val);
        let pool;
        let prefix;
        if (parts.length === 0) {
          pool = COMMANDS.map((c) => c.name);
          prefix = '';
        } else if (parts.length === 1 && !trailingSpace) {
          pool = COMMANDS.map((c) => c.name);
          prefix = parts[0].toLowerCase();
        } else {
          const entry = findCommand(parts[0].toLowerCase());
          pool = (entry && entry.args) || [];
          prefix = trailingSpace ? '' : (parts[parts.length - 1] || '').toLowerCase();
        }
        const matches = pool.filter((p) => p.startsWith(prefix));
        if (matches.length === 1) {
          const kept = trailingSpace ? parts : parts.slice(0, -1);
          input.value = [...kept, matches[0]].join(' ') + ' ';
          updateOverlay();
        } else if (matches.length > 1) {
          logOutput(`<span style="color:var(--ink-low);">${matches.join('&nbsp;&nbsp;')}</span>`);
        }
        return;
      }

      // 2. Intercept ArrowUp for command history traversal (backward)
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const activeHistory = isPythonRepl ? pythonHistory : shellHistory;
        let activeIndex = isPythonRepl ? pythonHistoryIndex : shellHistoryIndex;

        if (activeHistory.length > 0) {
          if (activeIndex === -1) {
            activeIndex = activeHistory.length - 1;
          } else if (activeIndex > 0) {
            activeIndex--;
          }
          
          if (isPythonRepl) {
            pythonHistoryIndex = activeIndex;
          } else {
            shellHistoryIndex = activeIndex;
          }

          input.value = activeHistory[activeIndex];
          updateOverlay();
          setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        }
        return;
      }

      // 3. Intercept ArrowDown for command history traversal (forward)
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const activeHistory = isPythonRepl ? pythonHistory : shellHistory;
        let activeIndex = isPythonRepl ? pythonHistoryIndex : shellHistoryIndex;

        if (activeIndex !== -1) {
          if (activeIndex < activeHistory.length - 1) {
            activeIndex++;
            input.value = activeHistory[activeIndex];
          } else {
            activeIndex = -1;
            input.value = '';
          }
          
          if (isPythonRepl) {
            pythonHistoryIndex = activeIndex;
          } else {
            shellHistoryIndex = activeIndex;
          }
          updateOverlay();
        }
        return;
      }

      // 4. Submit command on Enter
      if (e.key === 'Enter') {
        const text = input.value;

        const trimmed = text.trim();
        if (trimmed) {
          if (isPythonRepl) {
            if (pythonHistory.length === 0 || pythonHistory[pythonHistory.length - 1] !== trimmed) {
              pythonHistory.push(trimmed);
            }
            pythonHistoryIndex = -1;
          } else {
            if (shellHistory.length === 0 || shellHistory[shellHistory.length - 1] !== trimmed) {
              shellHistory.push(trimmed);
              if (shellHistory.length > 100) shellHistory.shift();
              try { localStorage.setItem(HISTORY_KEY, JSON.stringify(shellHistory)); } catch (e) { /* private mode */ }
            }
            shellHistoryIndex = -1;
          }
        }

        // Freeze this line — replace input wrapper with highlighted HTML
        inputWrapper.remove();
        const typed = document.createElement('span');
        if (isPythonRepl) {
          typed.innerHTML = highlightPython(text);
        } else {
          const commandRegex = COMMAND_REGEX; // derived from the registry
          if (commandRegex.test(text)) {
            typed.innerHTML = text.replace(commandRegex, '<span style="color:var(--cli-purple); font-weight:bold;">$1</span>');
          } else {
            typed.textContent = text;
            typed.style.color = 'var(--ink-hi)';
          }
        }
        typed.style.fontFamily = 'var(--font-code)';
        typed.style.fontSize = '0.9rem';
        wrapper.appendChild(typed);

        // Run the command (appends response lines)
        runCommand(text).then(() => {
          createPrompt();
        });
      }
    });

    cliInput = input;
    scrollBottom();
    setTimeout(() => input.focus(), 30);
  }

  // ------------------------------------------------------------- toggle terminal
  function toggleCLI(force) {
    const wasOpen = cliTerminal.classList.contains('is-open');
    const isOpen = force !== undefined ? force : !wasOpen;
    cliTerminal.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('cli-active', isOpen);

    // Back button closes the terminal; Forward re-opens it (see app.js).
    if (window.OverlayHistory) {
      if (isOpen && !wasOpen) window.OverlayHistory.opened('terminal');
      if (!isOpen && wasOpen) window.OverlayHistory.closed('terminal');
    }

    if (isOpen) {
      // Only create the first prompt once
      if (!cliOutput.querySelector('.cli-terminal__input-line')) {
        setTimeout(() => createPrompt(), 150);
      } else {
        setTimeout(() => cliInput && cliInput.focus(), 150);
      }
    }
  }

  if (window.OverlayHistory) {
    window.OverlayHistory.register('terminal', {
      open: () => toggleCLI(true),
      close: () => toggleCLI(false),
    });
  }

  // Touch devices: tappable quick-command chips above the input — typing
  // in a terminal on a phone keyboard is miserable. CSS shows these only
  // when (hover: none) matches.
  const chipBar = document.createElement('div');
  chipBar.className = 'cli-terminal__chips';
  ['help', 'neofetch', 'features', 'projects', 'contact', 'python', 'clear'].forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cli-terminal__chip';
    b.textContent = c;
    b.dataset.cmd = c;
    chipBar.appendChild(b);
  });
  const cliBody = cliTerminal.querySelector('.cli-terminal__body');
  if (cliBody) cliBody.appendChild(chipBar);
  chipBar.addEventListener('click', (e) => {
    const b = e.target.closest('.cli-terminal__chip');
    if (!b || !cliInput) return;
    cliInput.value = b.dataset.cmd;
    cliInput.dispatchEvent(new Event('input'));
    cliInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  });

  cliBtn.addEventListener('click', () => toggleCLI());
  cliClose.addEventListener('click', () => toggleCLI(false));

  // Backtick / tilde key toggle
  window.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') {
      e.preventDefault();
      toggleCLI();
    }
    if (e.key === 'Escape' && cliTerminal.classList.contains('is-open')) {
      toggleCLI(false);
    }
    // Ctrl+C (SIGINT): kill a runaway Python execution. Window-level on
    // purpose — the live input is removed from the DOM while a command
    // runs. Skipped when text is selected so normal copying still works.
    if (e.ctrlKey && e.key.toLowerCase() === 'c' &&
        cliTerminal.classList.contains('is-open') &&
        window.PyRuntime && window.PyRuntime.busy() &&
        !String(window.getSelection && getSelection()).length) {
      e.preventDefault();
      logOutput('<span style="color:var(--ink-low);">^C</span>');
      window.PyRuntime.terminate();
    }
  });

  // Click anywhere in the terminal body to focus the active input
  cliTerminal.addEventListener('click', (e) => {
    if (e.target !== cliClose && !e.target.closest('.cli-terminal__header')) {
      if (cliInput) cliInput.focus();
    }
  });

  // ------------------------------------------------------------- command logic
  function drawBarChart(level) {
    const totalBars = 20;
    const filledBars = Math.round((level / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    return `[${'=' .repeat(filledBars)}${' ' .repeat(emptyBars)}] ${level}%`;
  }

  // =============================================================== commands
  // Single source of truth: help, tab completion and "did you mean"
  // suggestions all derive from this registry.
  const COMMANDS = [
    { name: 'help',       desc: 'List available commands', run: cmdHelp },
    { name: 'neofetch',   desc: 'Visitor / system info card', run: cmdNeofetch },
    { name: 'features',   aliases: ['skills'],    desc: 'Technical capabilities as ASCII charts', run: cmdFeatures },
    { name: 'projects',   aliases: ['templates'], desc: 'List completed systems & projects', run: cmdProjects },
    { name: 'experience', aliases: ['roadmap'],   desc: 'Professional timeline & achievements', run: cmdExperience },
    { name: 'education',  aliases: ['docs'],      desc: 'Education credentials', run: cmdEducation },
    { name: 'contact',    aliases: ['pricing'],   desc: 'Email and social networks', run: cmdContact },
    { name: 'theme',      args: ['aurora', 'emerald', 'solar', 'ruby', 'obsidian'], desc: 'Switch color preset (theme emerald)', run: cmdTheme },
    { name: 'mode',       args: ['dark', 'light'], desc: 'Switch dark / light mode', run: cmdMode },
    { name: 'goto',       args: ['home', 'about', 'projects', 'experience', 'contact'], desc: 'Close the terminal and scroll to a section', run: cmdGoto },
    { name: 'open',       args: ['resume', 'guides', 'chat', 'project'], desc: 'Open a surface (open resume | guides | chat | project 1)', run: cmdOpen },
    { name: 'history',    desc: 'Show shell command history', run: cmdHistory },
    { name: 'python',     desc: 'Interactive Python 3.12 WebAssembly REPL', run: cmdPython },
    { name: 'pip',        args: ['install', 'list'], desc: 'Install packages from PyPI (pip install sympy)', run: cmdPip },
    { name: 'clear',      desc: 'Clear terminal history', run: cmdClear },
    { name: 'exit',       desc: 'Terminate console shell', run: cmdExit },
  ];
  const COMMAND_REGEX = new RegExp(
    `^(${COMMANDS.flatMap((c) => [c.name, ...(c.aliases || [])]).join('|')})\\b`
  );

  function findCommand(name) {
    return COMMANDS.find((c) => c.name === name || (c.aliases || []).includes(name));
  }

  // Small Levenshtein distance for "did you mean" suggestions on typos.
  function editDistance(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return dp[a.length][b.length];
  }

  function closestCommand(name) {
    let best = null;
    let bestDist = 3; // only suggest within edit distance 2
    COMMANDS.forEach((c) => {
      [c.name, ...(c.aliases || [])].forEach((n) => {
        const d = editDistance(name, n);
        if (d < bestDist) { bestDist = d; best = c.name; }
      });
    });
    return best;
  }

  // ---------------------------------------------- python REPL multi-line
  // Lines buffer while a block / bracket / continuation is open; a blank
  // line executes the buffered block, like the real Python REPL.
  let pyBuffer = [];

  function bracketBalance(src) {
    let depth = 0;
    let quote = null;
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '#') { while (i < src.length && src[i] !== '\n') i++; }
      else if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') depth--;
    }
    return depth;
  }

  function replShouldContinue(buffer) {
    if (bracketBalance(buffer.join('\n')) > 0) return true;
    const last = buffer[buffer.length - 1];
    if (/\\\s*$/.test(last)) return true;
    if (/:\s*$/.test(buffer[0])) return last.trim() !== ''; // block ends on a blank line
    if (/:\s*$/.test(last)) return true;
    return false;
  }

  async function runPythonLine(cmdText) {
    if (pyBuffer.length === 0) {
      const t = cmdText.trim();
      if (t === 'exit()' || t === 'quit()') {
        isPythonRepl = false;
        logOutput('Exiting Python REPL.');
        return;
      }
      if (!t) return;
    }
    pyBuffer.push(cmdText);
    if (replShouldContinue(pyBuffer)) return; // prompt switches to '...'

    const src = pyBuffer.join('\n');
    pyBuffer = [];
    try {
      const result = await window.PyRuntime.run(
        src,
        (text) => logOutput(esc(text)),
        (text) => logOutput(`<span style="color:var(--cli-red);">${esc(text)}</span>`)
      );
      if (result !== undefined && result !== null && String(result) !== '') {
        logOutput(esc(String(result)));
      }
    } catch (err) {
      logOutput(`<span style="color:var(--cli-red);">${esc(err.message)}</span>`);
    }
  }

  // ---------------------------------------------- command implementations

  function cmdHelp() {
    let out = 'Available commands:';
    COMMANDS.forEach((c) => {
      const alias = (c.aliases && c.aliases.length) ? ` (${c.aliases.join(', ')})` : '';
      out += `\n  <strong>${esc(c.name.padEnd(11))}</strong>- ${esc(c.desc)}${esc(alias)}`;
    });
    out += `\n\nTab completes commands & arguments · Ctrl+L clears · ↑/↓ browse history.`;
    logOutput(out);
  }

  function cmdClear() {
    cliOutput.innerHTML = '';
    cliOutput.scrollTop = 0;
  }

  function cmdExit() {
    toggleCLI(false);
  }

  function cmdNeofetch() {
    const username = (CONFIG.terminalPrompt && CONFIG.terminalPrompt.username) || 'visitor';
    const hostname = (CONFIG.terminalPrompt && CONFIG.terminalPrompt.hostname) || 'portfolio';
    const ua = navigator.userAgent;
    const browser =
      /edg\//i.test(ua) ? 'Edge' :
      /opr\//i.test(ua) ? 'Opera' :
      /chrome/i.test(ua) ? 'Chrome' :
      /firefox/i.test(ua) ? 'Firefox' :
      /safari/i.test(ua) ? 'Safari' : 'Browser';
    const os =
      /windows/i.test(ua) ? 'Windows' :
      /android/i.test(ua) ? 'Android' :
      /iphone|ipad/i.test(ua) ? 'iOS' :
      /mac/i.test(ua) ? 'macOS' :
      /linux/i.test(ua) ? 'Linux' : 'Unknown';
    const doc = document.documentElement;
    const preset = (doc.className.match(/theme-(\w+)/) || [null, 'aurora'])[1];
    const mode = doc.classList.contains('mode-dark') ? 'dark' : 'light';
    const hue = ((Math.round(parseFloat(getComputedStyle(doc).getPropertyValue('--hue')) || 0) % 360) + 360) % 360;
    const up = Math.floor(performance.now() / 1000);
    const uptime = `${Math.floor(up / 60)}m ${up % 60}s`;

    const art = [
      ' ███████╗ █████╗ ',
      ' ██╔════╝██╔══██╗',
      ' ███████╗███████║',
      ' ╚════██║██╔══██║',
      ' ███████║██║  ██║',
      ' ╚══════╝╚═╝  ╚═╝',
    ];
    const info = [
      `<strong>${esc(username)}@${esc(hostname)}</strong>`,
      '─────────────────',
      `<strong>OS:</strong>      ${os} · ${browser}`,
      `<strong>Shell:</strong>   portfolio-sh 2.0`,
      `<strong>Theme:</strong>   ${esc(preset)} (${mode}) · hue ${hue}°`,
      `<strong>Display:</strong> ${window.innerWidth}×${window.innerHeight}`,
      `<strong>Stack:</strong>   Vanilla JS · zero dependencies`,
      `<strong>Python:</strong>  3.12 WASM (worker thread)`,
      `<strong>Uptime:</strong>  ${uptime}`,
    ];
    let out = '';
    const rows = Math.max(art.length, info.length);
    for (let i = 0; i < rows; i++) {
      const a = art[i] || ' '.repeat(18);
      out += `<span style="color:var(--cli-purple); font-weight:700;">${a}</span>  ${info[i] || ''}\n`;
    }
    logOutput(out);
  }

  function cmdTheme(args) {
    const valid = ['aurora', 'emerald', 'solar', 'ruby', 'obsidian'];
    const preset = (args[0] || '').toLowerCase();
    if (!valid.includes(preset)) {
      logOutput(`Usage: theme &lt;${valid.join('|')}&gt;`);
      return;
    }
    if (typeof window.setThemePreset !== 'function') {
      logOutput('<span style="color:var(--cli-red);">Theme controls are still booting — try again in a second.</span>');
      return;
    }
    window.setThemePreset(preset);
    logOutput(`<span style="color:var(--cli-green);">Theme preset set to ${preset}.</span>`);
  }

  function cmdMode(args) {
    const mode = (args[0] || '').toLowerCase();
    if (mode !== 'dark' && mode !== 'light') {
      logOutput('Usage: mode &lt;dark|light&gt;');
      return;
    }
    if (typeof window.setColorMode !== 'function') {
      logOutput('<span style="color:var(--cli-red);">Theme controls are still booting — try again in a second.</span>');
      return;
    }
    window.setColorMode(mode);
    logOutput(`<span style="color:var(--cli-green);">Switched to ${mode} mode.</span>`);
  }

  function cmdGoto(args) {
    const map = { home: '#hero', about: '#about', projects: '#projects', experience: '#experience', contact: '#contact' };
    const section = (args[0] || '').toLowerCase();
    const target = map[section];
    if (!target) {
      logOutput(`Usage: goto &lt;${Object.keys(map).join('|')}&gt;`);
      return;
    }
    logOutput(`Navigating to ${esc(section)}...`);
    toggleCLI(false);
    setTimeout(() => {
      const link = document.querySelector(`a[href="${target}"]`);
      if (link) link.click();
      else window.location.hash = target;
    }, 250);
  }

  function cmdOpen(args) {
    const what = (args[0] || '').toLowerCase();
    if (what === 'resume') {
      logOutput('Opening resume viewer...');
      toggleCLI(false);
      setTimeout(() => {
        const b = document.getElementById('resume-btn') || document.querySelector('.nav__resume');
        if (b) b.click();
      }, 250);
      return;
    }
    if (what === 'guides') {
      logOutput('Opening learning guides...');
      toggleCLI(false);
      setTimeout(() => {
        if (typeof window.openGuidesDrawer === 'function') window.openGuidesDrawer();
      }, 250);
      return;
    }
    if (what === 'chat') {
      logOutput("Opening Sanju's AI agent...");
      toggleCLI(false);
      setTimeout(() => {
        const b = document.getElementById('ai-chat-toggle');
        if (b) b.click();
      }, 250);
      return;
    }
    if (what === 'project') {
      const projects = CONFIG.projects || [];
      const key = args.slice(1).join(' ').toLowerCase();
      const idx = parseInt(key, 10);
      const p = !isNaN(idx)
        ? projects[idx - 1]
        : projects.find((x) => x.title.toLowerCase().includes(key));
      if (!p) {
        logOutput(`Unknown project. Available:\n${projects.map((x, i) => `  ${i + 1}. ${esc(x.title)}`).join('\n')}`);
        return;
      }
      if (typeof window.openProjectDrawer !== 'function') {
        logOutput('<span style="color:var(--cli-red);">Project drawer is still booting — try again in a second.</span>');
        return;
      }
      logOutput(`Opening project: ${esc(p.title)}...`);
      toggleCLI(false);
      setTimeout(() => window.openProjectDrawer(p.title), 250);
      return;
    }
    logOutput('Usage: open &lt;resume|guides|chat|project N&gt;');
  }

  function cmdHistory() {
    if (!shellHistory.length) {
      logOutput('No shell history yet.');
      return;
    }
    logOutput(shellHistory.map((h, i) => `  ${String(i + 1).padStart(3)}  ${esc(h)}`).join('\n'));
  }

  async function cmdPython(args) {
    const flags = args.map((a) => a.toLowerCase());
    if (flags.includes('--version') || flags.includes('-v')) {
      logOutput('Python 3.12.1');
      return;
    }
    if (isPythonRepl) return;

    // Boot the runtime on its background thread (see py-worker.js) —
    // the page stays fully interactive while WASM downloads/compiles.
    try {
      logOutput('[python] Booting WebAssembly runtime on a worker thread...');
      await window.PyRuntime.warm(
        (text) => logOutput(esc(text)),
        (text) => logOutput(`<span style="color:var(--cli-red);">${esc(text)}</span>`)
      );
    } catch (err) {
      logOutput(`<span style="color:var(--cli-red);">Failed to load Pyodide: ${esc(err.message)}</span>`);
      return;
    }

    isPythonRepl = true;
    pyBuffer = [];
    logOutput(`Python 3.12.1 (main, WebAssembly)
Blocks continue after ':' — finish them with an empty line. "exit()" leaves, Ctrl+C interrupts.`);
  }

  const pipInstalled = [];

  async function cmdPip(args) {
    const sub = (args[0] || '').toLowerCase();
    const pkg = args[1] || '';

    if (sub === 'list') {
      let out = 'Package          Source\n──────────────── ────────────────';
      out += `\n${'python-stdlib'.padEnd(17)}bundled (Pyodide)`;
      pipInstalled.forEach((p) => { out += `\n${esc(p).padEnd(17)}PyPI (micropip)`; });
      logOutput(out);
      return;
    }

    if (sub === 'install' && pkg) {
      logOutput(`[pip] Initializing WebAssembly package manager...`);

      // micropip runs on the worker thread — the page never blocks.
      try {
        logOutput(`[pip] Querying PyPI and downloading ${esc(pkg)}...`);
        await window.PyRuntime.pip(
          pkg,
          (text) => logOutput(esc(text)),
          (text) => logOutput(`<span style="color:var(--cli-red);">${esc(text)}</span>`)
        );
        if (!pipInstalled.includes(pkg)) pipInstalled.push(pkg);
        logOutput(`<span style="color:var(--cli-green);">[pip] Successfully installed ${esc(pkg)} inside the WebAssembly environment.</span>`);
      } catch (err) {
        logOutput(`<span style="color:var(--cli-red);">[pip] Installation failed: ${esc(err.message)}</span>`);
      }
      return;
    }

    logOutput(`Usage: pip install &lt;package&gt; · pip list<br>Example: <strong>pip install sympy</strong>`);
  }

  function cmdFeatures() {
    let output = '<strong>Technical Stack Capabilities:</strong><br>';
    (CONFIG.skills || []).forEach((group) => {
      output += `<br><span style="color:var(--accent); font-weight:600;"># ${esc(group.category)}</span><br>`;
      (group.items || []).forEach((item) => {
        const bars = drawBarChart(item.level);
        output += `${esc(item.name).padEnd(45, '.')} <span class="cli-bar-chart">${bars}</span><br>`;
      });
    });
    logOutput(output);
  }

  function cmdProjects() {
    let output = '<strong>Systems & Featured Projects:</strong><br>';
    (CONFIG.projects || []).forEach((p) => {
      output += `<br>• <strong>${esc(p.title)}</strong> (${esc(p.category)})
  <em>Details:</em> ${esc(p.description)}
  <em>Tags:</em> ${esc(p.tags.join(', '))}<br>`;
    });
    output += `<br><span style="color:var(--ink-low);">Tip: "open project 1" opens the full details drawer.</span>`;
    logOutput(output);
  }

  function cmdExperience() {
    let output = '<strong>Professional Timeline:</strong><br>';
    (CONFIG.experience || []).forEach((job) => {
      output += `<br>• <strong>${esc(job.role)}</strong> (${esc(job.company)})
  <em>Status:</em> ${esc(job.location)} | <em>Duration:</em> ${esc(job.duration)}
  <em>Focus:</em> ${esc(job.description)}<br>`;
      (job.highlights || []).forEach((h) => {
        output += `  - ${esc(h)}<br>`;
      });
    });
    logOutput(output);
  }

  function cmdEducation() {
    let output = '<strong>Education Credentials:</strong><br>';
    (CONFIG.education || []).forEach((e) => {
      output += `<br>• <strong>${esc(e.degree)}</strong>
  <em>Institution:</em> ${esc(e.institution)} | <em>Duration:</em> ${esc(e.duration)}
  <em>Detail:</em> ${esc(e.description || '')}<br>`;
    });
    logOutput(output);
  }

  function cmdContact() {
    const isLIOff = CONFIG.features && CONFIG.features.blockLinkedIn;
    const isGHOff = CONFIG.features && CONFIG.features.blockGitHub;
    const isIGOff = CONFIG.features && CONFIG.features.blockInstagram;

    const linkedinLine = isLIOff
      ? `  • <strong>LinkedIn:</strong> <span style="color:var(--ink-low);">[Offline for updates]</span>`
      : `  • <strong>LinkedIn:</strong> <a class="cli-link" href="${esc(CONFIG.profile.linkedin)}" target="_blank">${esc(CONFIG.profile.linkedin)}</a>`;

    const githubLine = isGHOff
      ? `  • <strong>GitHub:</strong> <span style="color:var(--ink-low);">[Offline for maintenance]</span>`
      : `  • <strong>GitHub:</strong> <a class="cli-link" href="${esc(CONFIG.profile.github)}" target="_blank">${esc(CONFIG.profile.github)}</a>`;

    const instagramLine = isIGOff
      ? `  • <strong>Instagram:</strong> <span style="color:var(--ink-low);">[Offline for maintenance]</span>`
      : `  • <strong>Instagram:</strong> <a class="cli-link" href="https://www.instagram.com/geekified_coder" target="_blank">@geekified_coder</a>`;

    const output = `<strong>Contact Information & Social Networks:</strong><br>
  • <strong>Email:</strong> <a class="cli-link" href="mailto:${esc(CONFIG.profile.email)}">${esc(CONFIG.profile.email)}</a>
${linkedinLine}
${githubLine}
${instagramLine}`;
    logOutput(output);
  }

  // ------------------------------------------------------------- dispatcher
  async function runCommand(cmdText) {
    // Python REPL mode: lines go to the worker (with multi-line buffering)
    if (isPythonRepl) {
      await runPythonLine(cmdText);
      return;
    }

    const trimmed = cmdText.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const name = parts[0].toLowerCase();
    const entry = findCommand(name);
    if (entry) {
      await entry.run(parts.slice(1));
      return;
    }

    const suggestion = closestCommand(name);
    logOutput(
      `shell: command not found: ${esc(name)}.` +
      (suggestion
        ? ` Did you mean <strong>${esc(suggestion)}</strong>?`
        : ' Type <strong>help</strong> for a list of commands.')
    );
  }
})();

// Signals the lazy-load stub in app.js that this module now owns its surface.
window.__CLI_BOOTED = true;
