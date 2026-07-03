// =========================================================================
// PORTFOLIO CONFIGURATION
// Edit this file to update your personal details, work experience, projects,
// and skills. The entire UI will update automatically.
// =========================================================================

const CONFIG = {
  profile: {
    name: "Sanju Antony",
    title: "Backend & AI Engineer",
    subTitle: "Building intelligent systems across backend, AI, and Web3",
    // Rotating variant of the subtitle shown in the hero (prefix stays, words crossfade).
    subTitleRotate: {
      prefix: "Building intelligent systems across",
      words: ["the backend", "AI & LLMs", "Web3 & smart contracts"]
    },
    // Optional portrait image. Leave empty to show the initials monogram.
    avatarUrl: "Files/profile.png",
    location: "Tamil Nadu, India",
    about: "I am a backend developer transitioning into full-stack engineering, with a strong foundation in building scalable server-side systems and a passion for AI-driven development. I specialize in leveraging advanced LLM chatbots, Claude Code, and antigravity to optimize workflows and construct intelligent, interactive user experiences.",
    email: "sanjubibin44@gmail.com",
    github: "https://github.com/sanjubibin",
    linkedin: "https://www.linkedin.com/in/sanju-antony-603772191",
    resumeUrl: "Files/Resume.pdf",
  },

  socialLinks: [
    { name: "GitHub", url: "https://github.com/sanjubibin", icon: "github" },
    { name: "LinkedIn", url: "https://www.linkedin.com/in/sanju-antony-603772191", icon: "linkedin" },
    { name: "Gmail", url: "mailto:sanjubibin44@gmail.com", icon: "gmail" },
    { name: "Instagram", url: "https://www.instagram.com/geekified_coder", icon: "instagram" }
  ],

  // Skill categorization with proficiency levels (optional, visual meters)
  skills: [
    {
      category: "Backend Frameworks & Languages",
      items: [
        { name: "Python", level: 95 },
        { name: "FastAPI", level: 90 },
        { name: "Django", level: 85 },
        { name: "Node.js", level: 60 },
        { name: "Java", level: 50 }
      ]
    },
    {
      category: "AI & Machine Learning",
      items: [
        { name: "Embedding Models & LLMs (Gemini, Claude, OpenAI)", level: 90 },
        { name: "Vector Databases (Pinecone, ChromaDB, Milvus)", level: 85 },
        { name: "Prompt Engineering & Claude Code Development", level: 90 },
        { name: "PyTorch & TensorFlow (Basic Models)", level: 70 }
      ]
    },
    {
      category: "Blockchain & Web3",
      items: [
        { name: "Solidity", level: 80 },
        { name: "Smart Contracts (ERC-20, ERC-721 & Others)", level: 85 },
        { name: "Ethereum Network Architecture", level: 80 },
        { name: "Ethers.js / Hardhat / Testnet Deployment", level: 75 }
      ]
    },
    {
      category: "Cloud, DevOps & Tools",
      items: [
        { name: "Docker", level: 80 },
        { name: "AWS (EC2, Lambda, IAM, S3 & Others)", level: 75 },
        { name: "Git, GitHub & Bitbucket", level: 90 },
        { name: "Jira & Agile Methodologies", level: 85 }
      ]
    },
    {
      category: "Frontend Essentials",
      items: [
        { name: "HTML5", level: 80 },
        { name: "CSS3 & Responsive Layouts", level: 75 },
        { name: "JavaScript (ES6+)", level: 75 }
      ]
    }
  ],

  // Work experience timeline
  experience: [
    {
      role: "AI & Web3 Software Engineer",
      company: "Ionixx Technologies",
      location: "On-site",
      duration: "2023 October - Present",
      description: "Leading core R&D initiatives in generative AI integrations (Anthropic services) and Web3 asset tokenization platforms.",
      highlights: [
        "Currently leading research and development initiatives on Anthropic services and features, exploring and integrating advanced AI capabilities.",
        "Architected and developed custom Model Context Protocol (MCP) servers and clients to provide structured, consent-based context for AI interactions, enhancing LLM accuracy and safety.",
        "Led research and development for a 'Real Estate Tokenization' platform, designing secure architectures and implementing token standard best practices.",
        "Developed and audited Solidity smart contracts on the Ethereum network and L2 solutions, including ERC-20, ERC-721, and multisig wallet contracts.",
        "Conducted in-depth analysis of AI tooling, model optimizations, and workflows to inform strategic application development decisions.",
        "Utilized Hardhat, Ethers.js, and MetaMask to test, audit, and deploy smart contracts across testnets and mainnets."
      ]
    },
    {
      role: "Backend Developer Intern",
      company: "Ionixx Technologies",
      location: "On-site",
      duration: "2022 December - 2023 September",
      description: "Contributed to core Python/Django web application development, database optimizations, and API migrations.",
      highlights: [
        "Successfully migrated legacy Java 1.6 Spring Boot APIs to modern Python Django web APIs, completing all migration targets ahead of schedule.",
        "Applied Python OOP and functional programming patterns to develop scalable REST/MVC web architectures.",
        "Leveraged Node.js for asynchronous, event-driven scripting and real-time backend integration tasks.",
        "Designed and optimized relational database schemas, query executions, and user authentication modules."
      ]
    }
  ],

  // Project portfolio cards with tags, description, and live URLs
  projects: [
    {
      title: "Ionixx GPT",
      description: "An AI Chatbot built on Anthropic's Large Language Models. Features a custom Model Context Protocol (MCP) server that feeds consent-based context, code execution environments, web search, and stream messaging.",
      category: "AI & Machine Learning",
      tags: ["LLMs", "Anthropic", "MCP Server", "Node.js", "Web Search"],
      codeLink: "",
      liveLink: "",
      architecture: "Client (Web UI) <---> SSE Connection <---> Node.js MCP Server (Express) <---> Anthropic API (Claude 3.5)",
      deepDive: [
        "Designed a custom Node.js Model Context Protocol (MCP) server providing real-time data access.",
        "Built consent-based security prompts to protect local execution parameters.",
        "Implemented Server-Sent Events (SSE) to stream message tokens dynamically, reducing first-token latency by 45%."
      ]
    },
    {
      title: "Real Estate Tokenization",
      description: "A blockchain-based asset tokenization platform. Deploys custom Solidity smart contracts (ERC-20, ERC-721) on Ethereum and L2 networks to represent real estate assets, with multisig wallets for enhanced security.",
      category: "Blockchain & Web3",
      tags: ["Solidity", "Hardhat", "MetaMask", "ERC-20", "ERC-721"],
      codeLink: "",
      liveLink: "",
      architecture: "DApp Frontend (Ethers.js) <---> MetaMask Wallet <---> Solidity Contracts (ERC-20/721) <---> Ethereum / Polygon Network",
      deepDive: [
        "Authored Solidity smart contracts incorporating OpenZeppelin ERC-20 and ERC-721 standards.",
        "Integrated multisign (Gnosis Safe) wallet architectures to govern high-value asset transfers.",
        "Wrote comprehensive Hardhat test suites achieving 100% smart contract statement and branch coverage."
      ]
    },
    {
      title: "Personal Financial Dashboard",
      description: "A confidential dashboard application providing consent-based asset and liability tracking. Integrates Plaid API for USA financial data and is researched against Sahamati RBI guidelines for India's Account Aggregator network.",
      category: "Backend & Cloud",
      tags: ["Plaid API", "Sahamati AA", "Node.js", "Fintech"],
      codeLink: "",
      liveLink: "",
      architecture: "Client UI <---> Node.js Backend API <---> Plaid Link Gateway / Sahamati AA API <---> Financial Data Providers",
      deepDive: [
        "Integrated Plaid API to fetch secure financial records across multiple institutions in the USA.",
        "Designed a local ledger database complying with Sahamati guidelines for India's Account Aggregator network.",
        "Implemented token-based OAuth data consent verification flows ensuring compliance with financial security policies."
      ]
    },
    {
      title: "Mifos API Migration",
      description: "Led the performance-critical migration of assigned Java 1.6 Spring Boot microservice APIs to Python Django MVC architectures, ensuring backward compatibility and improved latency.",
      category: "Backend & Cloud",
      tags: ["Django", "Python", "Java 1.6", "Spring Boot"],
      codeLink: "",
      liveLink: "",
      architecture: "Legacy Spring Boot (Java 1.6) APIs ===> API Gateway (Reverse Proxy) ===> New Django MVC (Python 3)",
      deepDive: [
        "Migrated 15+ legacy Java Spring Boot endpoints to Python Django MVC frameworks, meeting strict type requirements.",
        "Optimized Django ORM SQL query execution, decreasing baseline latency by 35% on critical batch requests.",
        "Maintained backward compatibility for old databases during parallel deployment, ensuring zero downtime."
      ]
    }
  ],

  // Education information
  education: [
    {
      degree: "Bachelor of Engineering in Mechanical Engineering",
      institution: "Mar Ephraem College of Engineering and Technology, Kanyakumari",
      duration: "June 2018 - April 2022",
      description: "CGPA: 7.82"
    }
  ]
};

// Export config for ES Modules if imported, or bind to window for standard script tag usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}
