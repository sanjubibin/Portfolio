// =========================================================================
// APPLICATION LOGIC - DYNAMIC CONTENT RENDERING
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Load configuration
  const config = window.CONFIG;
  if (!config) {
    console.error("Configuration file (config.js) not loaded!");
    return;
  }

  // Render all views
  initNavigation();
  renderProfile(config.profile, config.socialLinks);
  renderOverview(config);
  renderExperience(config.experience);
  renderSkills(config.skills);
  renderProjects(config.projects);
  initContactForm(config.profile.email);
  initThemeToggle();
});

/* ---------------------------------------------------------
   NAVIGATION HANDLER
   --------------------------------------------------------- */
function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".content-section");
  const mainContent = document.querySelector(".main-content");

  navItems.forEach((item) => {
    const button = item.querySelector("button");
    button.addEventListener("click", () => {
      const targetSectionId = button.getAttribute("data-section");

      // Update active nav item
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      // Transition sections
      sections.forEach((section) => {
        section.classList.remove("active");
        if (section.getAttribute("id") === targetSectionId) {
          section.classList.add("active");
        }
      });

      // Scroll main content area back to top
      mainContent.scrollTop = 0;

      // Special action: Trigger skill bar animation if skills section is loaded
      if (targetSectionId === "skills") {
        animateSkillBars();
      }
    });
  });
}

/* ---------------------------------------------------------
   PROFILE RENDERER
   --------------------------------------------------------- */
function renderProfile(profile, socialLinks) {
  // Set avatar initials or image
  const avatarContainer = document.getElementById("avatar-container");
  if (profile.avatar) {
    avatarContainer.innerHTML = `<img src="${profile.avatar}" alt="${profile.name}">`;
  } else {
    // Generate initials from name (e.g. Sanjubibin -> SB or S)
    const initials = profile.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    avatarContainer.textContent = initials;
  }

  // Text contents
  document.getElementById("profile-name").textContent = profile.name;
  document.getElementById("profile-title").textContent = profile.title;
  document.getElementById("profile-subtitle").textContent = profile.subTitle;
  document.getElementById("about-paragraph").textContent = profile.about;

  // Social Footer Icons
  const sidebarFooter = document.getElementById("sidebar-footer");
  sidebarFooter.innerHTML = "";
  
  socialLinks.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.className = "social-icon";
    a.title = link.name;
    
    // Choose appropriate SVG icon based on name
    let svgIcon = "";
    if (link.icon === "github") {
      svgIcon = `<svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`;
    } else if (link.icon === "linkedin") {
      svgIcon = `<svg viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`;
    } else if (link.icon === "mail") {
      svgIcon = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`;
    } else if (link.icon === "gmail") {
      svgIcon = `<svg viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>`;
    }
    
    a.innerHTML = svgIcon;
    sidebarFooter.appendChild(a);
  });
}

/* ---------------------------------------------------------
   OVERVIEW & STATS RENDERER
   --------------------------------------------------------- */
function renderOverview(config) {
  // Compute Stats
  const totalProjects = config.projects.length;
  
  // Count unique skills
  let skillCount = 0;
  config.skills.forEach(cat => skillCount += cat.items.length);
  
  // Calculate years of experience from experience array
  const experienceYears = config.experience.length * 1.5; // Estimated multiplier or solid anchor
  const displayYears = config.experience.length > 0 ? `${config.experience.length}+` : "1+";

  document.getElementById("stat-experience").textContent = displayYears;
  document.getElementById("stat-projects").textContent = totalProjects;
  document.getElementById("stat-skills").textContent = skillCount;

  // Render Quick Contact List
  const quickContactList = document.getElementById("quick-contact-list");
  quickContactList.innerHTML = "";

  const contacts = [
    {
      label: "Email Me",
      value: config.profile.email,
      icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
      link: `mailto:${config.profile.email}`
    },
    {
      label: "GitHub",
      value: config.profile.github.replace("https://", ""),
      icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>`,
      link: config.profile.github
    },
    {
      label: "LinkedIn",
      value: profileUrlUsername(config.profile.linkedin),
      icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
      link: config.profile.linkedin
    }
  ];

  contacts.forEach(c => {
    const item = document.createElement("div");
    item.className = "contact-info-item";
    item.innerHTML = `
      <div class="contact-info-icon">${c.icon}</div>
      <div class="contact-info-text">
        <h4>${c.label}</h4>
        <p><a href="${c.link}" target="_blank" style="color: inherit; text-decoration: none;">${c.value}</a></p>
      </div>
    `;
    quickContactList.appendChild(item);
  });

  // Setup Resume Button Link
  const resumeBtn = document.getElementById("resume-btn");
  resumeBtn.onclick = () => {
    if (config.profile.resumeUrl !== "#") {
      window.open(config.profile.resumeUrl, "_blank");
    } else {
      alert("Resume PDF not yet configured in config.js!");
    }
  };
}

function profileUrlUsername(url) {
  try {
    const parts = url.replace(/\/$/, "").split("/");
    return parts[parts.length - 1];
  } catch (e) {
    return "Profile";
  }
}

/* ---------------------------------------------------------
   EXPERIENCE RENDERING
   --------------------------------------------------------- */
function renderExperience(experience) {
  const timeline = document.getElementById("experience-timeline");
  timeline.innerHTML = "";

  experience.forEach((exp) => {
    const item = document.createElement("div");
    item.className = "timeline-item glass-card";
    
    const highlightsHTML = exp.highlights
      .map(hl => `<li>${hl}</li>`)
      .join("");

    item.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-header">
        <div>
          <h3 class="role-title">${exp.role}</h3>
          <span class="company-meta">${exp.company} &bull; ${exp.location || 'Remote'}</span>
        </div>
        <span class="duration-badge">${exp.duration}</span>
      </div>
      <p class="timeline-desc">${exp.description}</p>
      <ul class="timeline-highlights">
        ${highlightsHTML}
      </ul>
    `;
    timeline.appendChild(item);
  });
}

/* ---------------------------------------------------------
   SKILLS RENDERING
   --------------------------------------------------------- */
function renderSkills(skills) {
  const container = document.getElementById("skills-container");
  container.innerHTML = "";

  skills.forEach((cat) => {
    const categoryBlock = document.createElement("div");
    categoryBlock.className = "skills-category";

    const title = document.createElement("h3");
    title.className = "skills-category-title";
    title.textContent = cat.category;
    categoryBlock.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "skills-grid";

    cat.items.forEach((skill) => {
      const item = document.createElement("div");
      item.className = "skill-bar-wrapper";
      item.innerHTML = `
        <div class="skill-info">
          <span class="skill-name">${skill.name}</span>
          <span class="skill-level">${skill.level}%</span>
        </div>
        <div class="skill-track">
          <div class="skill-fill" data-level="${skill.level}"></div>
        </div>
      `;
      grid.appendChild(item);
    });

    categoryBlock.appendChild(grid);
    container.appendChild(categoryBlock);
  });
}

function animateSkillBars() {
  const fills = document.querySelectorAll(".skill-fill");
  fills.forEach((fill) => {
    // Reset first
    fill.style.width = "0%";
    
    // Animate to level
    setTimeout(() => {
      const targetLevel = fill.getAttribute("data-level");
      fill.style.width = `${targetLevel}%`;
    }, 150);
  });
}

/* ---------------------------------------------------------
   PROJECTS RENDERING & FILTERING
   --------------------------------------------------------- */
function renderProjects(projects) {
  const filterContainer = document.getElementById("project-filters");
  const projectsGrid = document.getElementById("projects-grid");

  // Collect unique categories
  const categories = new Set();
  projects.forEach((proj) => categories.add(proj.category));

  // Build filter buttons
  filterContainer.innerHTML = `<button class="filter-btn active" data-filter="all">All Projects</button>`;
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.setAttribute("data-filter", cat);
    btn.textContent = cat;
    filterContainer.appendChild(btn);
  });

  // Render project cards function
  const renderCards = (filterCategory = "all") => {
    projectsGrid.innerHTML = "";
    
    const filteredProjects = filterCategory === "all" 
      ? projects 
      : projects.filter(p => p.category === filterCategory);

    filteredProjects.forEach((proj) => {
      const card = document.createElement("div");
      card.className = "project-card glass-card";
      
      const tagsHTML = proj.tags
        .map(tag => `<span class="tag">${tag}</span>`)
        .join("");

      let linksHTML = "";
      if (proj.codeLink) {
        linksHTML += `
          <a href="${proj.codeLink}" target="_blank" class="project-link">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            Code
          </a>`;
      }
      if (proj.liveLink) {
        linksHTML += `
          <a href="${proj.liveLink}" target="_blank" class="project-link">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            Live Demo
          </a>`;
      }

      card.innerHTML = `
        <div>
          <span class="project-category">${proj.category}</span>
          <h3 class="project-title">${proj.title}</h3>
          <p class="project-desc">${proj.description}</p>
        </div>
        <div>
          <div class="project-tags">
            ${tagsHTML}
          </div>
          <div class="project-links">
            ${linksHTML}
          </div>
        </div>
      `;
      projectsGrid.appendChild(card);
    });
  };

  // Initial render
  renderCards("all");

  // Setup click listeners for filter buttons
  const filterBtns = filterContainer.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const filterValue = btn.getAttribute("data-filter");
      renderCards(filterValue);
    });
  });
}

/* ---------------------------------------------------------
   CONTACT FORM HANDLER
   --------------------------------------------------------- */
function initContactForm(recipientEmail) {
  const form = document.getElementById("contact-me-form");
  const statusMsg = document.getElementById("form-status");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("contact-name").value;
    const email = document.getElementById("contact-email").value;
    const subject = document.getElementById("contact-subject").value;
    const message = document.getElementById("contact-message").value;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML;

    // Loading State
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg style="animation: spin 1s linear infinite; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25"></circle>
        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"></path>
      </svg>
      Sending...
    `;

    // Injecting CSS keyframe dynamic style for spin animation if not exists
    if (!document.getElementById("spin-animation-style")) {
      const style = document.createElement("style");
      style.id = "spin-animation-style";
      style.innerHTML = "@keyframes spin { to { transform: rotate(360deg); } }";
      document.head.appendChild(style);
    }

    // Simulate sending form content (GitHub pages is static, so we simulate submission success and fall back to mailto link)
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;

      // Display Status
      statusMsg.className = "form-status-message success";
      statusMsg.textContent = `Thank you, ${name}! Your message was simulated successfully. Redirecting to mail client...`;
      
      // Fallback redirect to email client via mailto
      setTimeout(() => {
        const bodyText = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
        window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
        form.reset();
        statusMsg.style.display = "none";
      }, 1500);

    }, 1200);
  });
}

/* ---------------------------------------------------------
   THEME TOGGLE SWITCH LOGIC (DARK / LIGHT)
   --------------------------------------------------------- */
function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  const iconMoon = toggleBtn.querySelector(".icon-moon");
  const iconSun = toggleBtn.querySelector(".icon-sun");
  const themeText = document.getElementById("theme-text");

  const setLightTheme = () => {
    document.body.classList.remove("dark-mode");
    iconMoon.style.display = "block";
    iconSun.style.display = "none";
    if (themeText) themeText.textContent = "Light Mode";
    localStorage.setItem("theme", "light");
  };

  const setDarkTheme = () => {
    document.body.classList.add("dark-mode");
    iconMoon.style.display = "none";
    iconSun.style.display = "block";
    if (themeText) themeText.textContent = "Dark Mode";
    localStorage.setItem("theme", "dark");
  };

  // Check saved preference - default to light if not set
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    setDarkTheme();
  } else {
    setLightTheme();
  }

  toggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-mode");
    if (isDark) {
      setLightTheme();
    } else {
      setDarkTheme();
    }
  });
}
