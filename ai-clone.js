(() => {
  'use strict';

  const CONFIG = window.CONFIG;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Element Cache
  const toggleBtn = $('#ai-chat-toggle');
  const chatContainer = $('#ai-chat-container');
  const closeBtn = $('#ai-chat-close');
  const chatForm = $('#ai-chat-form');
  const chatInput = $('#ai-chat-input');
  const chatMessages = $('#ai-chat-messages');

  if (!toggleBtn || !chatContainer || !chatMessages || !chatInput || !chatForm) {
    console.warn('AI Chat elements missing from DOM — initialization skipped.');
    return;
  }

  // ------------------------------------------------------------- chat state
  let isOpen = false;

  function toggleChat(force) {
    isOpen = force !== undefined ? force : !isOpen;
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    chatContainer.setAttribute('aria-hidden', String(!isOpen));

    const isMobile = window.innerWidth <= 480;
    const targetBottom = isMobile ? 16 : 24;
    const targetRight = isMobile ? 16 : 24;
    const targetWidth = isMobile ? window.innerWidth - 32 : 380;
    const targetHeight = isMobile ? Math.min(window.innerHeight * 0.72, 520) : 580;
    const targetBorderRadius = isMobile ? '24px' : '20px';

    // No animation engine (perf-lite devices / blocked CDN): CSS-transition
    // fallback — transform/opacity only, so it stays smooth even there.
    if (!window.gsap) {
      const cs = chatContainer.style;
      if (isOpen) {
        const ping = $('.ai-chat-toggle__ping', toggleBtn);
        if (ping) ping.style.display = 'none';
        cs.cssText += `display:flex; pointer-events:all;` +
          `width:${targetWidth}px; height:${targetHeight}px;` +
          `left:auto; top:auto; bottom:${targetBottom}px; right:${targetRight}px;` +
          `border-radius:${targetBorderRadius};`;
        Array.from(chatContainer.children).forEach((c) => { c.style.opacity = '1'; });
        toggleBtn.style.opacity = '0';
        toggleBtn.style.pointerEvents = 'none';
        chatContainer.classList.add('chat-lite', 'chat-lite--closed');
        // Double-rAF: the closed state must paint before transitioning out
        // of it, or the browser skips the animation entirely.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          chatContainer.classList.remove('chat-lite--closed');
          chatInput.focus();
        }));
      } else {
        chatContainer.classList.add('chat-lite--closed');
        toggleBtn.style.opacity = '1';
        toggleBtn.style.pointerEvents = 'all';
        setTimeout(() => {
          if (!isOpen) {
            cs.display = 'none';
            chatContainer.classList.remove('chat-lite', 'chat-lite--closed');
          }
        }, 320);
      }
      return;
    }

    // FLIP morph: the panel is laid out at its FINAL geometry exactly once,
    // then the grow/shrink between the button and the panel is pure
    // transform + opacity — compositor-only, no per-frame layout or paint.
    if (isOpen) {
      // Hide notification ping once opened
      const ping = $('.ai-chat-toggle__ping', toggleBtn);
      if (ping) ping.style.display = 'none';

      // Kill any in-flight tweens
      gsap.killTweensOf([chatContainer, chatContainer.children, toggleBtn]);

      // One-time layout at the final geometry (the only layout this causes)
      gsap.set(chatContainer, {
        display: 'flex',
        clearProps: 'transform',
        left: 'auto',
        top: 'auto',
        bottom: targetBottom,
        right: targetRight,
        width: targetWidth,
        height: targetHeight,
        borderRadius: targetBorderRadius,
        opacity: 0,
        pointerEvents: 'none',
        transformOrigin: 'top left'
      });

      const p = chatContainer.getBoundingClientRect();
      const b = toggleBtn.getBoundingClientRect();

      // Hide toggle while chat is open
      gsap.set(toggleBtn, { pointerEvents: 'none', opacity: 0 });

      gsap.fromTo(chatContainer,
        {
          x: b.left - p.left,
          y: b.top - p.top,
          scaleX: (b.width || 112) / p.width,
          scaleY: (b.height || 44) / p.height,
          opacity: 0
        },
        {
          x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1,
          duration: 0.38,
          ease: 'power3.out',
          onComplete: () => {
            // Clean transform so the drag logic measures an untransformed box
            gsap.set(chatContainer, { pointerEvents: 'all', clearProps: 'transform' });
          }
        }
      );

      // Content rides along mid-morph instead of waiting for it to finish
      gsap.fromTo(chatContainer.children,
        { opacity: 0, y: 10 },
        {
          opacity: 1, y: 0, duration: 0.3, delay: 0.14, stagger: 0.04,
          ease: 'power2.out', onComplete: () => chatInput.focus()
        }
      );

    } else {
      // Kill any in-flight tweens
      gsap.killTweensOf([chatContainer, chatContainer.children, toggleBtn]);

      // Restore toggle immediately
      gsap.set(toggleBtn, { pointerEvents: 'all', opacity: 1 });

      // Measure from an untransformed box (an interrupted open may have
      // left a partial transform behind)
      gsap.set(chatContainer, { pointerEvents: 'none', clearProps: 'transform', transformOrigin: 'top left' });
      const p = chatContainer.getBoundingClientRect();
      const b = toggleBtn.getBoundingClientRect();

      // Content fades concurrently with the shrink, not before it —
      // and FLIP handles a dragged panel automatically (it translates
      // home to the button from wherever it currently sits).
      gsap.to(chatContainer.children, { opacity: 0, y: -6, duration: 0.15, ease: 'power2.in' });
      gsap.to(chatContainer, {
        x: b.left - p.left,
        y: b.top - p.top,
        scaleX: (b.width || 112) / p.width,
        scaleY: (b.height || 44) / p.height,
        opacity: 0,
        duration: 0.32,
        ease: 'power3.inOut',
        onComplete: () => {
          // Reset container to hidden default state
          gsap.set(chatContainer, {
            display: 'none',
            clearProps: 'transform',
            left: 'auto',
            top: 'auto',
            bottom: targetBottom,
            right: targetRight
          });
        }
      });
    }
  }

  toggleBtn.addEventListener('click', () => toggleChat());
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleChat(false);
  });

  // Close when clicking outside of the chatContainer AND outside the toggleBtn
  document.addEventListener('click', (e) => {
    if (isOpen && !chatContainer.contains(e.target) && !toggleBtn.contains(e.target)) {
      toggleChat(false);
    }
  });

  // Esc key to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggleChat(false);
  });

  // Dragging Logic
  let isDragging = false;
  let startX, startY;
  let startLeft, startTop;

  const header = $('.ai-chat-header');

  header.addEventListener('mousedown', startDrag);
  header.addEventListener('touchstart', startDrag, { passive: true });

  function startDrag(e) {
    if (e.target.closest('#ai-chat-close')) return;

    isDragging = true;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    startX = clientX;
    startY = clientY;

    const rect = chatContainer.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    chatContainer.style.userSelect = 'none';

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', doDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
  }

  function doDrag(e) {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const dx = clientX - startX;
    const dy = clientY - startY;

    let newLeft = startLeft + dx;
    let newTop = startTop + dy;

    // Clamp inside viewport boundaries
    const maxLeft = window.innerWidth - chatContainer.offsetWidth;
    const maxTop = window.innerHeight - chatContainer.offsetHeight;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    chatContainer.style.bottom = 'auto';
    chatContainer.style.right = 'auto';
    chatContainer.style.left = `${newLeft}px`;
    chatContainer.style.top = `${newTop}px`;
  }

  // Restore drag cleanup
  function stopDrag() {
    isDragging = false;
    chatContainer.style.userSelect = '';
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', doDrag);
    document.removeEventListener('touchend', stopDrag);
  }  // ------------------------------------------------------------- NLP router
  function getBotResponse(rawText) {
    const text = rawText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '');

    // Intent: Greetings
    if (/\b(hi|hello|hey|yo|greetings|hola|good morning|good afternoon)\b/.test(text)) {
      return `Hello! I'm Sanju's AI Agent. How can I help you explore Sanju Antony's professional credentials today? Ask me about his experience, technical skills, projects, or how to contact him!`;
    }

    // Intent: Features / Skills
    if (/\b(features|skills|technologies|capabilities|fastapi|python|solidity|frameworks|runtimes|mcp|model context protocol|servers|languages|stack)\b/.test(text)) {
      return `Sanju Antony specializes in backend engineering and AI developments:
• **Backend Frameworks:** Heavy production experience with Python (FastAPI, Django MVC) and Node.js backend pipelines, optimizing ORM databases to drop API latency.
• **Generative AI & LLMs:** Built custom Model Context Protocol (MCP) servers and LLM chatbot assistants integrating Pinecone and ChromaDB vector indexing.
• **Web3 Ledger Architectures:** Authored and audited Solidity smart contracts (ERC-20/721 standards) using Hardhat testbeds and MetaMask nodes.`;
    }

    // Intent: Pricing
    if (/\b(pricing|price|cost|tiers|subscribe|paid|free|sandbox|plans|plan|hiring|rates|freelance|job)\b/.test(text)) {
      return `For consulting rates, freelance projects, or full-time recruitment queries, feel free to drop a line via the **Get In Touch** message form on this page, or email Sanju directly at **sanjubibin44@gmail.com**!`;
    }

    // Intent: Roadmap / Experience
    if (/\b(roadmap|milestones|timeline|experience|version|release|beta|work|job|role|history|career)\b/.test(text)) {
      return `Sanju Antony is currently an **AI & Web3 Software Engineer** at **Ionixx Technologies**:
• **Generative AI & MCP:** Leading core R&D on Anthropic API tools and custom Model Context Protocol (MCP) data-context integrations.
• **Smart Contracts:** Deploys Solidity ledgers and Gnosis Safe multisig assets.
• **Microservice Migration:** Previously migrated legacy Java microservices to Python Django backend containers, achieving a 35% latency drop.`;
    }

    // Intent: Templates / Projects
    if (/\b(templates|projects|code|one-click|deploy|fintech|plaid|chat|ledger|portfolio)\b/.test(text)) {
      const templateList = (CONFIG.projects || []).map(p => `• **${p.title}:** ${p.description}`).join('\n\n');
      return `Some of Sanju's featured projects and systems include:\n\n${templateList}\n\nSelect a card in the **Projects** grid to inspect details and architectural breakdowns!`;
    }

    // Intent: Support / Contact
    if (/\b(contact|support|sales|demo|inquiry|hire|email|linkedin|reach|message|phone)\b/.test(text)) {
      const links = [];
      const isEmailOff = CONFIG.features && CONFIG.features.blockEmail;
      const isLIOff = CONFIG.features && CONFIG.features.blockLinkedIn;
      const isGHOff = CONFIG.features && CONFIG.features.blockGitHub;
      
      if (!isEmailOff) links.push(`email at **${CONFIG.profile.email}**`);
      if (!isLIOff) links.push(`[LinkedIn](${CONFIG.profile.linkedin})`);
      if (!isGHOff) links.push(`[GitHub](${CONFIG.profile.github})`);
      
      const notes = [];
      if (isEmailOff) notes.push("Email inbox is temporarily offline.");
      if (isLIOff) notes.push("LinkedIn is offline for updates.");
      if (isGHOff) notes.push("GitHub is offline for structural updates.");

      // Fallback if all 3 direct channels are blocked
      if (links.length === 0) {
        return `All direct messaging channels (Email, LinkedIn, GitHub) are currently offline for maintenance. Please send a message directly using the **Contact Form** at the bottom of this page!`;
      }
      
      let listText = links.join(', ');
      const lastComma = listText.lastIndexOf(', ');
      if (lastComma !== -1) {
        listText = listText.substring(0, lastComma) + ' or ' + listText.substring(lastComma + 2);
      }
      
      const notesText = notes.length > 0 ? `\n\n*(Note: ${notes.join(' ')} Please feel free to use the contact form on this page to send a message!)*` : '\n\nAlternatively, submit a message directly via the contact form on this page!';
      
      return `You can reach Sanju Antony directly via ${listText}.${notesText}`;
    }

    // Intent: Help
    if (/\b(help|commands|what can you do|suggest|menu)\b/.test(text)) {
      return `You can ask me questions about Sanju Antony using natural questions:
• *"What skills/languages do you use?"*
• *"Tell me about your work experience"*
• *"What projects have you built?"*
• *"How can I get in touch with you?"*`;
    }

    // Fallback
    return `I'm not fully sure how to answer that from Sanju's portfolio details. Try asking about **skills**, **experience**, **projects**, or contact him directly at **${CONFIG.profile.email}**!`;
  }

  // ------------------------------------------------------------- submit message
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    // 1. User Bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-msg chat-msg--user';
    userBubble.textContent = text;
    chatMessages.appendChild(userBubble);

    chatInput.value = '';
    chatInput.disabled = true;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 2. Typings Bubble
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-msg chat-msg--bot';
    typingBubble.innerHTML = '<span class="typing-dots">Thinking...</span>';

    const responseText = getBotResponse(text);

    // Timeline for typing delay
    setTimeout(() => {
      chatMessages.appendChild(typingBubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      setTimeout(() => {
        // Remove typing bubble and render actual bot response
        typingBubble.remove();
        const botBubble = document.createElement('div');
        botBubble.className = 'chat-msg chat-msg--bot';
        botBubble.innerHTML = formatMarkdown(responseText);
        chatMessages.appendChild(botBubble);

        chatInput.disabled = false;
        chatInput.focus();
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 1000); // typing state duration
    }, 250);
  });

  // Very lightweight markdown helper for links and bullet points in response
  function formatMarkdown(str) {
    let html = esc(str);
    // Replace newlines with breaks
    html = html.replace(/\n/g, '<br>');
    // Bullet points
    html = html.replace(/•\s/g, '&bull; ');
    // Strong tags
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Em tags
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Markdown links: [text](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return html;
  }
})();

// Signals the lazy-load stub in app.js that this module now owns its surface.
window.__AI_BOOTED = true;
