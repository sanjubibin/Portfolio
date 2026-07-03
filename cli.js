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

  // ------------------------------------------------------------- create prompt
  // Appends a new live input-line at the bottom of the output stream

  function createPrompt() {
    const wrapper = document.createElement('div');
    wrapper.className = 'cli-terminal__input-line';

    const promptSpan = document.createElement('span');
    promptSpan.className = 'cli-terminal__prompt';
    promptSpan.textContent = 'sanju@portfolio:~$';

    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Terminal Input');
    input.placeholder = "type 'help' to see commands...";
    input.className = 'cli-terminal__live-input';

    wrapper.appendChild(promptSpan);
    wrapper.appendChild(input);
    cliOutput.appendChild(wrapper);

    // Wire up the Enter key on this new input
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = input.value;

        // 1. Freeze this line — replace live input with plain text
        input.remove();
        const typed = document.createElement('span');
        typed.textContent = ' ' + text;
        typed.style.color = '#fff';
        wrapper.appendChild(typed);

        // 2. Run the command (appends response lines)
        runCommand(text);

        // 3. Spawn a fresh prompt at the bottom
        createPrompt();
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
    return `[${'='.repeat(filledBars)}${' '.repeat(emptyBars)}] ${level}%`;
  }

  function runCommand(cmdText) {
    const cmd = cmdText.trim().toLowerCase();
    if (!cmd) return;

    if (cmd === 'help') {
      logOutput(`Available commands:
  <strong>skills</strong>      - Render technical competency matrix as ASCII bars
  <strong>projects</strong>    - List featured backend, AI, and smart contract repos
  <strong>experience</strong>  - Fetch work timeline and key accomplishments
  <strong>education</strong>   - Output academic degrees and credentials
  <strong>contact</strong>     - Output email, socials, and portfolio links
  <strong>clear</strong>       - Clear terminal history
  <strong>exit</strong>        - Terminate shell session`);
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

    if (cmd === 'skills') {
      let output = '<strong>Technical Competency Matrix:</strong><br>';
      (CONFIG.skills || []).forEach((group) => {
        output += `<br><span class="cli-terminal__title"># ${esc(group.category)}</span><br>`;
        (group.items || []).forEach((item) => {
          const bars = drawBarChart(item.level);
          output += `${esc(item.name).padEnd(40, '.')} <span class="cli-bar-chart">${bars}</span><br>`;
        });
      });
      logOutput(output);
      return;
    }

    if (cmd === 'projects') {
      let output = '<strong>Featured Project Contexts:</strong><br>';
      (CONFIG.projects || []).forEach((p) => {
        output += `<br>• <strong>${esc(p.title)}</strong> (${esc(p.category)})
  <em>Description:</em> ${esc(p.description)}
  <em>Tags:</em> ${esc(p.tags.join(', '))}<br>`;
      });
      logOutput(output);
      return;
    }

    if (cmd === 'experience') {
      let output = '<strong>Professional Timeline Context:</strong><br>';
      (CONFIG.experience || []).forEach((job) => {
        output += `<br>• <strong>${esc(job.role)}</strong> at ${esc(job.company)}
  <em>Duration:</em> ${esc(job.duration)} | <em>Location:</em> ${esc(job.location)}
  <em>Description:</em> ${esc(job.description)}<br>`;
        (job.highlights || []).forEach((h) => {
          output += `  - ${esc(h)}<br>`;
        });
      });
      logOutput(output);
      return;
    }

    if (cmd === 'education') {
      let output = '<strong>Academic Credentials:</strong><br>';
      (CONFIG.education || []).forEach((e) => {
        output += `<br>• <strong>${esc(e.degree)}</strong>
  <em>Institution:</em> ${esc(e.institution)} | <em>Duration:</em> ${esc(e.duration)}
  <em>Notes:</em> ${esc(e.description || '')}<br>`;
      });
      logOutput(output);
      return;
    }

    if (cmd === 'contact') {
      const output = `<strong>Contact Specifications:</strong>
  Email:    <a class="cli-link" href="mailto:${esc(CONFIG.profile.email)}">${esc(CONFIG.profile.email)}</a>
  Location: ${esc(CONFIG.profile.location)}
  GitHub:   <a class="cli-link" href="${esc(CONFIG.profile.github)}" target="_blank">${esc(CONFIG.profile.github)}</a>
  LinkedIn: <a class="cli-link" href="${esc(CONFIG.profile.linkedin)}" target="_blank">${esc(CONFIG.profile.linkedin)}</a>`;
      logOutput(output);
      return;
    }

    // Default error
    logOutput(`bash: command not found: ${esc(cmd)}. Type <strong>help</strong> for a list of commands.`);
  }
})();
