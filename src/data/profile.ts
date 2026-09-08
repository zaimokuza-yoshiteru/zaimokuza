/**
 * 个人信息 —— 修改此文件即可更新全站内容。
 */

/** 经历要点（每段经历下的项目条目） */
interface Highlight {
  period?: string
  title: string
  detail: string
  tags?: string[]
}

/** 一段经历（教育经历的 highlights 为空数组） */
interface ExperienceItem {
  period: string
  role: string
  org: string
  highlights: Highlight[]
}

/** 双语文案：页面默认中文，Hero 黑圈内显示英文 */
interface Bilingual {
  en: string
  zh: string
}

interface Profile {
  heroTitle: Bilingual
  bio: Bilingual
  quoteSource: Bilingual
  location: Bilingual
  projects: {
    title: string
    intro: string
    linkLabel: string
    fallback: string
    cat: { label: string; hint: string; greeting: string }
    entries: Record<string, { description: string }>
  }
  social: {
    github: string
    email?: string
  }
  experience: ExperienceItem[]
  experienceTitle: string
  bongo: { label: string; hint: string; greeting: string }
}

export const profile: Profile = {
  experienceTitle: '经历',
  bongo: { label: '让 Bongo Cat 敲敲鼓', hint: '点一下 · 来点节奏', greeting: '咚哒，咚哒。' },
  // 博客署名：默认中文，鼠标移入显示英文
  heroTitle: { en: "Hi, I'm Zaimokuza", zh: '你好，我是 Zaimokuza' },
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
    title: '开源作品',
    intro: '从研发协作到内部工具，让开源能力走进团队的日常工作。',
    linkLabel: '查看项目',
    fallback: '项目介绍整理中，点击查看仓库文档与使用说明。',
    cat: {
      label: '和咖波打个招呼',
      hint: '点一下 · 摸摸咖波',
      greeting: '喵，收到。',
    },
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

  // 经历时间线 —— 按时间倒序；highlights 为每段经历下的要点
  experience: [
    {
      period: '2021-07 — 至今',
      role: '全栈开发工程师',
      org: '华侨金信商业服务（深圳）有限公司上海分公司',
      highlights: [
        {
          period: '2025-01 — 至今',
          title: 'Teller Made Easy（新加坡华侨银行支行柜面系统）',
          detail:
            '柜员为客户办理转账、贷款等全量银行业务的核心系统，双屏通过 WebSocket 实时协同；承担前后端全栈开发（React + Spring Boot 4）。',
          tags: ['React', 'Spring Boot 4', 'WebSocket'],
        },
        {
          period: '2021-07 — 2024-12',
          title: '企业基础服务（Base Service）维护',
          detail:
            '代理中间件（Apache + Spring Cloud Gateway）及其他通用服务（授权认证、客户资料、日历管理等）的维护及新功能迭代，支持公司个人零售业务和企业银行业务项目升级，并为其他新业务平台提供稳定支撑。',
          tags: ['Apache', 'Spring Cloud Gateway', 'React + Webpack', 'Spring Boot 2/3', 'JDK 11/17/21'],
        },
      ],
    },
    {
      period: '2019-03 — 2021-06',
      role: 'Java 开发工程师',
      org: '沈阳东硕信息技术有限公司',
      highlights: [
        {
          title: '快速物联平台',
          detail:
            '物联网设备接入与管理平台，负责后端（Spring Boot + MySQL）与前端（Vue 3 + Ant Design Vue + Less）的全栈开发。',
          tags: ['Spring Boot', 'MySQL', 'Vue 3', 'Ant Design Vue', 'Less'],
        },
        {
          title: '湛钢 / 武钢 / 马钢热轧智慧制造系统',
          detail:
            '参与多条钢铁产线的热轧智慧制造系统开发，负责生产数据采集、业务接口与可视化模块，覆盖 SSM、Dubbo、DB2 等技术栈。',
          tags: ['SSM', 'Dubbo', 'DB2'],
        },
      ],
    },
    {
      period: '2017-08 — 2019-01',
      role: '研发工程师',
      org: '上海鲁班软件股份有限公司',
      highlights: [
        {
          title: '鲁班开放平台 / 鲁班商城',
          detail:
            '参与建筑行业 SaaS 开放平台与商城系统的研发，负责业务接口开发与第三方系统对接。',
          tags: ['Java', 'SSM', 'MySQL'],
        },
      ],
    },
    {
      period: '2014 — 2018',
      role: '本科 · 物联网工程',
      org: '宿州学院',
      highlights: [],
    },
  ],
}
