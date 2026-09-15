/**
 * 个人信息 —— 修改此文件即可更新全站内容。
 */

/** 一段工作或教育经历，仅保留时间、身份和机构。 */
interface ExperienceItem {
  period: string
  role: string
  org: string
}

/** 双语文案：页面默认中文，Hero 黑圈内显示英文 */
interface Bilingual {
  en: string
  zh: string
}

export interface BlogPost {
  slug: string
  title: string
  date: string
  category: string
  excerpt: string
  paragraphs?: string[]
  article?: string
  readingMinutes?: number
}

interface Profile {
  name: string
  nav: { home: string; blog: string }
  collections: { shown: string; more: string; allShown: string }
  articleUI: {
    contents: string; examples: string; copy: string; copied: string; copyFailed: string
    download: string; loading: string; loadFailed: string; retry: string; minutes: string
    top: string; backToTop: string; comparison: string; sourceCode: string
  }
  blog: {
    title: string; archiveTitle: string
    unit: string; emptyTitle: string; emptyDescription: string; back: string
    notFound: string
    posts: BlogPost[]
  }
  heroTitle: Bilingual
  heroRole: Bilingual
  bio: Bilingual
  quoteSource: Bilingual
  location: Bilingual
  projects: {
    unit: string
    title: string
    linkLabel: string
    fallback: string
    entries: Record<string, { description: string }>
  }
  social: {
    github: string
    email?: string
  }
  experience: ExperienceItem[]
  experienceTitle: string
}

export const profile: Profile = {
  name: 'Zaimokuza',
  nav: { home: '首页', blog: '博客' },
  collections: { shown: '已展示', more: '查看更多', allShown: '已展示全部' },
  articleUI: {
    contents: '阅读路线', examples: '最小实现 · 同一机制，两种语言',
    copy: '复制代码', copied: '已复制', copyFailed: '复制失败，请手动选择代码',
    download: '下载源码', loading: '正在打开文章…', loadFailed: '文章暂时未能加载。',
    retry: '重新加载', minutes: '分钟阅读', top: '回到开头', backToTop: '回到顶部', comparison: '框架对照', sourceCode: '代码片段',
  },
  blog: {
    title: '博客',
    archiveTitle: '全部文章',
    unit: '篇',
    emptyTitle: '故事，正在酝酿。',
    emptyDescription: '这里将记录技术实践、开源探索与日常思考。第一篇文章，敬请期待。',
    back: '返回博客列表',
    notFound: '这篇文章暂时不在这里。',
    // 长文正文独立维护，并在进入文章时加载；此处管理首页摘要。
    posts: [{
      slug: 'agent-context-management',
      title: 'Agent 上下文管理：渐进式理解七个框架',
      date: '2026-09-14',
      category: 'Agent 工程 · 上下文管理',
      excerpt: '从一次登录超时排查出发，对照 deepseek-harness、deer-flow、OpenClaw、Codex、Claude Code、pi 和 Hermes Agent，逐步理解上下文装配、预算、压缩与恢复。',
      article: 'context-management',
      readingMinutes: 60,
    }],
  },
  experienceTitle: '经历',
  // 博客署名：默认中文，鼠标移入显示英文
  heroTitle: { en: "Hi, I'm Zaimokuza", zh: '你好，我是 Zaimokuza' },
  heroRole: { en: 'Full-stack Engineer', zh: '全栈工程师' },
  // 中文保留用户提供的引用原文；英文为对应译文
  bio: {
    en: 'Unless you have investigated a problem, you have no right to speak about it. … Get on your feet and walk through every part of your field of work; follow Confucius and ask about everything. However limited your ability, you can still solve problems: before going out, your mind was empty; on your return, it is no longer empty, but filled with the materials needed to solve the problem. This is how problems are solved.',
    zh: "你对于某个问题没有调查，就停止你对于某个问题的发言权。……迈开你的两脚，到你的工作范围的各部分各地方去走走，学个孔夫子的'每事问'，任凭什么才力小也能解决问题，因为你未出门时脑子是空的，归来时脑子已经不是空的了，已经载来了解决问题的各种必要材料，问题就是这样子解决了。",
  },
  quoteSource: {
    zh: '《反对本本主义》 · 1930',
    en: 'Oppose Book Worship · 1930 / Translation',
  },
  location: { en: 'Shanghai, China', zh: '中国 · 上海' },

  social: {
    github: 'https://github.com/zaimokuza-yoshiteru',
    email: 'heshuang6571@163.com',
  },

  // 根据公开 README 归纳适用场景，不代表已在特定企业部署
  projects: {
    unit: '个作品',
    title: '开源作品',
    linkLabel: '查看项目',
    fallback: '项目介绍整理中，点击查看仓库文档与使用说明。',
    entries: {
      'dsh-acp-adapter': {
        description: '面向企业内模型访问受限、需要复用已采购编程产品（如 Devin）的场景，通过 ACP 协议将 Agent 接入 DeepSeek Harness，把分散的工作流程整合到统一工作台，并通过 Agent Loop 的钩子函数接入本地 AI 记忆等通用能力。',
      },
      'dsh-theme-library': {
        description: '用于探索 Codex 对 3D 场景的处理能力，将实验中的部分场景提取为动态壁纸。',
      },
      'atlassian-server-mcp': {
        description: '面向公司内部本地部署的 Jira、Confluence 和 Bitbucket Data Center，让 AI 助手通过统一接口查询需求、检索知识文档并参与代码评审流程。默认以只读方式开放能力，可按配置逐步开放操作，适合从信息查询开始接入已有研发体系。',
      },
      mcp2skill: {
        description: '面向已经建设 MCP 服务、希望让多种 AI 工具复用内部能力的团队，将服务生成可携带的 Agent Skill，并通过命令行按需发现和执行工具。连接、认证与工具筛选集中配置，便于在不同开发环境中复用同一套接入方式。',
      },
      'dsh-plugin-hub': {
        description: '面向公司、部门与小团队搭建 DeepSeek Harness 插件市场：公司配置品牌与 npm / Nexus 仓库，团队独立维护自己的插件目录。在同一界面完成发现、版本筛选、安装与卸载，适合通过企业内网分发通用工具和业务插件。',
      },
    },
  },

  // 工作与教育经历按时间倒序排列。
  experience: [
    {
      period: '2021-07 — 至今',
      role: '全栈工程师',
      org: '华侨金信商业服务（深圳）有限公司上海分公司',
    },
    {
      period: '2019-03 — 2021-06',
      role: '全栈工程师',
      org: '沈阳东硕信息技术有限公司',
    },
    {
      period: '2017-08 — 2019-01',
      role: '研发工程师',
      org: '上海鲁班软件股份有限公司',
    },
    {
      period: '2014 — 2018',
      role: '本科 · 物联网工程',
      org: '宿州学院',
    },
  ],
}
