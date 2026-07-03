(() => {
  'use strict';

  const CONFIG = window.CONFIG;
  const HAS_GSAP = !!(window.gsap && window.ScrollToPlugin);

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
    chatContainer.classList.toggle('is-active', isOpen);
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    chatContainer.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      // Hide notification ping once opened
      const ping = $('.ai-chat-toggle__ping', toggleBtn);
      if (ping) ping.style.display = 'none';

      setTimeout(() => chatInput.focus(), 150);
    }
  }

  toggleBtn.addEventListener('click', () => toggleChat());
  closeBtn.addEventListener('click', () => toggleChat(false));

  // Esc key to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggleChat(false);
  });

  // ------------------------------------------------------------- NLP router
  function getBotResponse(rawText) {
    const text = rawText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '');

    // Intent: Greetings
    if (/\b(hi|hello|hey|yo|greetings|hola|good morning|good afternoon)\b/.test(text)) {
      return `Hello! I'm Sanju's AI Clone. How can I help you explore my portfolio today? Ask me about my experience, projects, or technical skills!`;
    }

    // Intent: Skills
    if (/\b(skill|skills|technologies|languages|frameworks|databases|python|solidity|fastapi|django|node|javascript|aws|docker)\b/.test(text)) {
      return `Here is a summary of my technical skills:
• **Backend Frameworks & Languages:** Python, FastAPI, Django, Node.js, Java.
• **AI & Machine Learning:** LLMs (Gemini, Claude, OpenAI), Vector Databases (Pinecone, ChromaDB), Model Context Protocol (MCP) server development.
• **Blockchain & Web3:** Solidity, Smart Contracts (ERC-20, ERC-721), Hardhat, Ethers.js, MetaMask.
• **Cloud & DevOps:** Docker, AWS (EC2, Lambda, S3, IAM), Git/GitHub.`;
    }

    // Intent: Experience
    if (/\b(experience|work|jobs|company|ionixx|history|career|employer|role|roles)\b/.test(text)) {
      return `I am currently an **AI & Web3 Software Engineer** at **Ionixx Technologies** (October 2023 - Present), where I lead generative AI integrations (Anthropic services) and Web3 asset tokenization platforms.

Before that, I worked as a **Backend Developer Intern** at Ionixx, migrating legacy Java Spring Boot microservice APIs to modern Python Django MVC architectures.`;
    }

    // Intent: Projects
    if (/\b(projects|apps|portfolio|code|repos|github|mifos|gpt|tokenization|dashboard)\b/.test(text)) {
      const projectsList = (CONFIG.projects || []).map(p => `• **${p.title}:** ${p.description}`).join('\n\n');
      return `Here are some featured projects I've built:\n\n${projectsList}\n\nFeel free to filter and inspect them in the **Projects** section of the page!`;
    }

    // Intent: MCP
    if (/\b(mcp|model context protocol|servers|server|client|agents|claude code|agent)\b/.test(text)) {
      return `I specialize in the **Model Context Protocol (MCP)**. I design and build custom MCP servers and clients to supply consent-based, secure context directly to LLMs (like Claude and Gemini). This allows AI agents to interact with secure databases, search the web, and run code securely.`;
    }

    // Intent: Contact
    if (/\b(contact|hire|email|linkedin|reach|message|phone|gmail|talk|cv|resume)\b/.test(text)) {
      return `You can reach me directly via email at **${CONFIG.profile.email}** or connect with me on [LinkedIn](${CONFIG.profile.linkedin}).

You can also download my CV / Resume or send me a message through the **Contact** form on this page!`;
    }

    // Intent: Education
    if (/\b(education|college|degree|bachelor|university|mar ephraem|gpa|cgpa|studies)\b/.test(text)) {
      const edu = CONFIG.education[0];
      return `I hold a **${edu.degree}** from **${edu.institution}** (CGPA: 7.82, Graduated April 2022). I transitioned into backend development shortly after graduation, focusing on Python, Web3, and generative AI.`;
    }

    // Intent: Help
    if (/\b(help|commands|what can you do|suggest|menu)\b/.test(text)) {
      return `You can ask me questions about my profile using natural query commands. Try typing:
• *"What skills do you have?"*
• *"Tell me about your work experience"*
• *"Show me your projects"*
• *"What is MCP?"*
• *"How can I contact you?"*`;
    }

    // Fallback
    return `I'm not fully sure how to answer that from my local portfolio database. Try asking about my **skills**, **experience**, **projects**, or **MCP servers**, or contact me directly at **${CONFIG.profile.email}**!`;
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
