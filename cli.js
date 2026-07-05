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

  let pyodideInstance = null;
  let isPythonRepl = false;

  const shellHistory = [];
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

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
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
      placeholders.push({ id, html: `<span style="color:#94a3b8; font-style:italic;">${match}</span>` });
      return id;
    });

    // 2. Strings
    temp = temp.replace(/("(?:\\"|[^"])*"|'(?:\\'|[^'])*')/g, (match) => {
      const id = `___PY_TOKEN_STRING_${placeholders.length}___`;
      placeholders.push({ id, html: `<span style="color:#22c55e;">${match}</span>` });
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
      placeholders.push({ id, html: `<span style="color:#c084fc; font-weight:700;">${match}</span>` });
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
      placeholders.push({ id, html: `<span style="color:#38bdf8; font-weight:600;">${match}</span>` });
      return id;
    });

    // 5. Functions
    temp = temp.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/g, (match) => {
      const id = `___PY_TOKEN_FUNC_${placeholders.length}___`;
      placeholders.push({ id, html: `<span style="color:#eab308;">${match}</span>` });
      return id;
    });

    // 6. Numbers
    temp = temp.replace(/\b(\d+(?:\.\d+)?)\b/g, (match) => {
      const id = `___PY_TOKEN_NUM_${placeholders.length}___`;
      placeholders.push({ id, html: `<span style="color:#fb923c;">${match}</span>` });
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
      promptSpan.textContent = '>>> ';
      promptSpan.style.color = '#38bdf8';
    } else {
      const username = (CONFIG.terminalPrompt && CONFIG.terminalPrompt.username) || 'visitor';
      const hostname = (CONFIG.terminalPrompt && CONFIG.terminalPrompt.hostname) || 'portfolio';
      promptSpan.innerHTML = `<span style="color:#22c55e; font-weight:bold;">${esc(username)}@${esc(hostname)}</span>:<span style="color:#3b82f6; font-weight:bold;">~</span>$`;
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
    input.placeholder = isPythonRepl ? "e.g. print(2 + 2)" : "type 'help' to see commands...";
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
        const commandRegex = /^(help|about|skills|projects|experience|contact|clear|python)\b/;
        if (commandRegex.test(val)) {
          overlay.innerHTML = val.replace(commandRegex, '<span style="color:#c084fc; font-weight:bold;">$1</span>');
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
          const commandRegex = /^(help|about|skills|projects|experience|contact|clear|python)\b/;
          if (commandRegex.test(text)) {
            typed.innerHTML = text.replace(commandRegex, '<span style="color:#c084fc; font-weight:bold;">$1</span>');
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
    const isOpen = force !== undefined ? force : !cliTerminal.classList.contains('is-open');
    cliTerminal.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('cli-active', isOpen);

    if (isOpen) {
      // Only create the first prompt once
      if (!cliOutput.querySelector('.cli-terminal__input-line')) {
        setTimeout(() => createPrompt(), 150);
      } else {
        setTimeout(() => cliInput && cliInput.focus(), 150);
      }
    }
  }

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

  async function runCommand(cmdText) {
    const cmd = cmdText.trim().toLowerCase();
    
    // Python REPL Interpreter Mode Interceptor
    if (isPythonRepl) {
      const rawText = cmdText.trim();
      if (rawText === 'exit()' || rawText === 'quit()') {
        isPythonRepl = false;
        logOutput('Exiting Python REPL.');
        return;
      }
      if (!rawText) return;

      try {
        let result = await pyodideInstance.runPythonAsync(cmdText);
        if (result !== undefined && result !== null && String(result) !== '') {
          logOutput(esc(String(result)));
        }
      } catch (err) {
        logOutput(`<span style="color:#ef4444;">${esc(err.message)}</span>`);
      }
      return;
    }

    if (!cmd) return;

    if (cmd === 'help') {
      logOutput(`Available commands:
  <strong>features</strong>    - Renders technical capabilities as ASCII charts
  <strong>templates</strong>   - List completed systems & projects
  <strong>experience</strong>  - Show professional timeline & achievements
  <strong>education</strong>   - Show education credentials
  <strong>contact</strong>     - Output email and social networks
  <strong>python</strong>      - Start interactive Python 3.12 WebAssembly REPL
  <strong>pip</strong>         - Install packages from PyPI (e.g. pip install sympy)
  <strong>clear</strong>       - Clear terminal history
  <strong>exit</strong>        - Terminate console shell`);
      return;
    }

    if (cmd === 'clear') {
      cliOutput.innerHTML = '';
      cliOutput.scrollTop = 0;
      return;
    }

    if (cmd === 'exit') {
      toggleCLI(false);
      return;
    }

    if (cmd.startsWith('python')) {
      const parts = cmdText.trim().split(/\s+/);
      const args = parts.slice(1).map(a => a.toLowerCase());
      
      if (args.includes('--version') || args.includes('-v')) {
        logOutput('Python 3.12.1');
        return;
      }

      if (isPythonRepl) return;

      if (!pyodideInstance) {
        try {
          if (typeof loadPyodide === 'undefined') {
            await loadScript('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
          }
          
          pyodideInstance = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
            stdout: (text) => logOutput(esc(text)),
            stderr: (text) => logOutput(`<span style="color:#ef4444;">${esc(text)}</span>`)
          });
        } catch (err) {
          logOutput(`<span style="color:#ef4444;">Failed to load Pyodide: ${esc(err.message)}</span>`);
          return;
        }
      }

      isPythonRepl = true;
      logOutput(`Python 3.12.1 (main, WebAssembly)
Type "exit()" or "quit()" to return to the host terminal shell.`);
      return;
    }

    if (cmd.startsWith('pip')) {
      const parts = cmdText.trim().split(/\s+/);
      const sub = parts[1] ? parts[1].toLowerCase() : '';
      const pkg = parts[2] || '';

      if (sub === 'install' && pkg) {
        logOutput(`[pip] Initializing WebAssembly package manager...`);
        
        // 1. Ensure Pyodide is loaded
        if (!pyodideInstance) {
          try {
            if (typeof loadPyodide === 'undefined') {
              await loadScript('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
            }
            pyodideInstance = await loadPyodide({
              indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
              stdout: (text) => logOutput(esc(text)),
              stderr: (text) => logOutput(`<span style="color:#ef4444;">${esc(text)}</span>`)
            });
          } catch (err) {
            logOutput(`<span style="color:#ef4444;">[pip] Failed to initialize WebAssembly: ${esc(err.message)}</span>`);
            return;
          }
        }

        // 2. Install package using Pyodide micropip
        try {
          logOutput(`[pip] Querying PyPI and downloading ${esc(pkg)}...`);
          await pyodideInstance.loadPackage('micropip');
          const micropip = pyodideInstance.pyimport('micropip');
          await micropip.install(pkg);
          logOutput(`<span style="color:#22c55e;">[pip] Successfully installed ${esc(pkg)} inside the WebAssembly environment.</span>`);
        } catch (err) {
          logOutput(`<span style="color:#ef4444;">[pip] Installation failed: ${esc(err.message)}</span>`);
        }
        return;
      }

      // Default pip help text
      logOutput(`Usage: pip install &lt;package&gt;<br>Example: <strong>pip install sympy</strong>`);
      return;
    }

    if (cmd === 'features') {
      let output = '<strong>Technical Stack Capabilities:</strong><br>';
      (CONFIG.skills || []).forEach((group) => {
        output += `<br><span style="color:var(--accent); font-weight:600;"># ${esc(group.category)}</span><br>`;
        (group.items || []).forEach((item) => {
          const bars = drawBarChart(item.level);
          output += `${esc(item.name).padEnd(45, '.')} <span class="cli-bar-chart">${bars}</span><br>`;
        });
      });
      logOutput(output);
      return;
    }

    if (cmd === 'templates' || cmd === 'projects') {
      let output = '<strong>Systems & Featured Projects:</strong><br>';
      (CONFIG.projects || []).forEach((p) => {
        output += `<br>• <strong>${esc(p.title)}</strong> (${esc(p.category)})
  <em>Details:</em> ${esc(p.description)}
  <em>Tags:</em> ${esc(p.tags.join(', '))}<br>`;
      });
      logOutput(output);
      return;
    }

    if (cmd === 'experience' || cmd === 'roadmap') {
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
      return;
    }

    if (cmd === 'education' || cmd === 'docs') {
      let output = '<strong>Education Credentials:</strong><br>';
      (CONFIG.education || []).forEach((e) => {
        output += `<br>• <strong>${esc(e.degree)}</strong>
  <em>Institution:</em> ${esc(e.institution)} | <em>Duration:</em> ${esc(e.duration)}
  <em>Detail:</em> ${esc(e.description || '')}<br>`;
      });
      logOutput(output);
      return;
    }

    if (cmd === 'contact' || cmd === 'pricing') {
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
      return;
    }

    // Default error
    logOutput(`shell: command not found: ${esc(cmd)}. Type <strong>help</strong> for a list of commands.`);
  }
})();
