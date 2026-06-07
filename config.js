// =========================================================================
// PORTFOLIO CONFIGURATION
// Edit this file to update your personal details, work experience, projects,
// and skills. The entire UI will update automatically.
// =========================================================================

const CONFIG = {
  profile: {
    name: "Sanjubibin",
    title: "Backend & AI Engineer",
    subTitle: "Aspiring Full Stack Web & Application Developer",
    about: "I am a backend developer transitioning into full-stack engineering, with a strong foundation in building scalable server-side systems and a passion for AI-driven development. I specialize in leveraging advanced LLM chatbots, Claude Code, and antigravity to optimize workflows and construct intelligent, interactive user experiences.",
    email: "sanjubibin44@gmail.com",
    github: "https://github.com/sanjubibin",
    linkedin: "https://linkedin.com/in/sanjubibin",
    resumeUrl: "#",
  },

  socialLinks: [
    { name: "GitHub", url: "https://github.com/sanjubibin", icon: "github" },
    { name: "LinkedIn", url: "https://linkedin.com/in/sanjubibin", icon: "linkedin" },
    { name: "Gmail", url: "mailto:sanjubibin44@gmail.com", icon: "gmail" }
  ],

  // Skill categorization with proficiency levels (optional, visual meters)
  skills: [
    {
      category: "Backend Frameworks & Languages",
      items: [
        { name: "Python", level: 95 },
        { name: "FastAPI", level: 90 },
        { name: "Django", level: 85 },
        { name: "Node.js", level: 75 },
        { name: "Java", level: 60 }
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
      role: "Backend & AI Solutions Engineer",
      company: "Innovate AI Lab",
      location: "On-site",
      duration: "2024 - Present",
      description: "Spearheading backend architectures utilizing FastAPI and cloud infrastructure, while designing custom Retrieval-Augmented Generation (RAG) pipelines for enterprise search.",
      highlights: [
        "Implemented document chunking and vector storage systems using advanced embedding models and vector databases, reducing document search retrieval latency by 45%.",
        "Orchestrated integration of LLM endpoints (Claude, Gemini, OpenAI) to create intelligent conversational agents.",
        "Deployed containerized services with Docker onto AWS EC2 and created serverless microservices via AWS Lambda.",
        "Leveraged Claude Code and advanced prompt engineering to boost developer velocity and code quality."
      ]
    },
    {
      role: "Blockchain Developer (Smart Contracts)",
      company: "Decentralized Web Solutions",
      location: "On-site",
      duration: "2023 - 2024",
      description: "Designed, tested, and audited secure Ethereum smart contracts written in Solidity for various decentralized applications.",
      highlights: [
        "Authored, compiled, and deployed custom tokens following ERC-20 and ERC-721 collection standards.",
        "Executed contract deployments and testing across Ethereum testnets (Sepolia, Goerli) and mainnet.",
        "Optimized gas consumption routines, yielding average contract deployment savings of 20%.",
        "Collaborated with frontend developers to link smart contract events using Node.js and web3 client libraries."
      ]
    },
    {
      role: "Intern",
      company: "Ionixx Technologies",
      location: "On-site",
      duration: "2022 december - 2023 september",
      description: "As a backend intern, I played a pivotal role in developing and maintaining robust Python/Django web applications, as well as designing and optimizing relational database schemas and REST APIs. My contributions extended to implementing secure authentication mechanisms, enhancing data management workflows, and ensuring the overall reliability and performance of the backend systems.",
      highlights: [
        "Developed and maintained backend web applications using Python and Django, ensuring high performance and scalability.",
        "Designed and optimized relational database schemas, implementing efficient data management workflows and ensuring data integrity.",
        "Implemented secure authentication mechanisms and REST APIs, enhancing system security and facilitating seamless data exchange.",
        "migration of java 1.6 application to latest django version"
      ]
    }
  ],

  // Project portfolio cards with tags, description, and live URLs
  projects: [
    {
      title: "Context-Aware RAG API",
      description: "A production-ready FastAPI backend implementing semantic document search. Generates vector embeddings, indexes them in a vector store, and synthesizes answers using Claude/Gemini with highly optimized prompt context.",
      category: "AI & Machine Learning",
      tags: ["FastAPI", "Vector DB", "LLMs", "Docker"],
      codeLink: "https://github.com/sanjubibin/rag-api",
      liveLink: ""
    },
    {
      title: "Gas-Optimized Token Suite",
      description: "A suite of Solidity smart contracts for ERC-20 and ERC-721 tokens featuring customized gas savings, mint limits, and batch operations. Deployed and verified on Sepolia testnet.",
      category: "Blockchain & Web3",
      tags: ["Solidity", "Hardhat", "Sepolia", "ERC-20"],
      codeLink: "https://github.com/sanjubibin/smart-contracts",
      liveLink: ""
    },
    {
      title: "AI-Powered Development Assistant",
      description: "Integration patterns using Claude Code and custom system instructions. Automates boilerplate generation for Django REST frameworks and formats custom developer prompts.",
      category: "AI & Machine Learning",
      tags: ["Claude Code", "Prompt Eng.", "Django", "LLMs"],
      codeLink: "https://github.com/sanjubibin/prompt-helper",
      liveLink: ""
    },
    {
      title: "Task Orchestrator & API Gateway",
      description: "An API Gateway microservice running on AWS Lambda and EC2. Manages background worker jobs, handles webhooks from Jira/Bitbucket, and provides containerized deployments.",
      category: "Backend & Cloud",
      tags: ["AWS Lambda", "EC2", "Docker", "Node.js"],
      codeLink: "https://github.com/sanjubibin/gateway",
      liveLink: ""
    }
  ],

  // Education information
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "Technical University",
      duration: "2018 - 2022",
      description: "Specialized in Software Engineering, Backend Architecture, and Distributed Systems."
    }
  ]
};

// Export config for ES Modules if imported, or bind to window for standard script tag usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}
