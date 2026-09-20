/**
 * 个人信息 —— 修改此文件即可更新全站内容。
 */

/** 一段工作或教育经历，仅保留时间、身份和机构。 */
interface ExperienceItem {
  kind: 'work' | 'education'
  period: string
  role: string
  org: string
}

export interface BlogPost {
  slug: string
  title: string
  date: string
  category: string
  excerpt: string
  article: string
  readingMinutes?: number
}

interface Profile {
  name: string
  nav: { home: string; blog: string; starred: string; github: string }
  collections: { shown: string; more: string }
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
  heroGreeting: string
  heroName: string
  heroPortraitAlt: string
  projects: {
    title: string
    entries: Record<string, { description: string }>
  }
  starred: {
    title: string
    switchLabel: string
    notFound: string
    panels: { calendar: string; weekly: string; languages: string; rhythm: string; readings: string; contributors: string; releases: string; commits: string }
    stats: { stars: string; perDay: string; forks: string; watchers: string; issues: string; commits: string; pushed: string }
    tags: { built: string; site: string }
    calendar: {
      rangeLabel: string; weeksUnit: string; commitsUnit: string; busiestLabel: string
      activeDaysLabel: string; longestLabel: string; currentLabel: string; daysUnit: string
      lessLabel: string; moreLabel: string; empty: string
    }
    weekly: { averageLabel: string; commitsUnit: string; upLabel: string; downLabel: string }
    rhythm: {
      timezone: string; quietPrefix: string; quietHoursUnit: string; sharePrefix: string
    }
    readings: {
      peakLabel: string; peakUnit: string
      quietPrefix: string; quietHoursUnit: string; quietSharePrefix: string
      weekendLabel: string; weekendValue: string
      workLabel: string; workValue: string
      sampleLabel: string; sampleValue: string; sampleUnit: string
      weekdayNames: string[]
    }
    contributors: { headPrefix: string; headPeopleUnit: string; headTopPrefix: string; commitsUnit: string; empty: string }
    releases: { headPrefix: string; headVersionsUnit: string; headMedianPrefix: string; prereleaseLabel: string; empty: string }
    commits: { headPrefix: string; empty: string }
    relative: { today: string; yesterday: string; daysAgo: string }
    entries: Record<string, { description: string }>
  }
  repoUI: {
    fallback: string
    releaseLabel: string
    prereleaseLabel: string
    nearLabel: string
    weeksUnit: string
    activityLabel: string
    commitsLabel: string
    forksLabel: string
    issuesLabel: string
    contributorsLabel: string
  }
  social: {
    github: string
  }
  experience: ExperienceItem[]
  experienceKinds: Record<ExperienceItem['kind'], string>
  experienceTitle: string
}

export const profile: Profile = {
  name: 'Zaimokuza',
  nav: { home: '首页', blog: '博客', starred: '观测', github: 'GitHub' },
  collections: { shown: '已展示', more: '博客列表' },
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
  experienceKinds: { work: '工作', education: '教育' },
  // 首页身份信息
  heroGreeting: '你好，我是',
  heroName: 'Zaimokuza',
  heroPortraitAlt: '由稀疏粒子组成的金发卡通人物肖像',

  social: {
    github: 'https://github.com/zaimokuza-yoshiteru',
  },

  // 根据公开 README 归纳适用场景，不代表已在特定企业部署
  // 展示清单与顺序取自 GitHub 个人主页的置顶仓库
  projects: {
    title: '开源作品',
    entries: {
      'dsh-acp-adapter': {
        description: '面向企业内模型访问受限、需要复用已采购编程产品（如 Devin）的场景，通过 ACP 协议将 Agent 接入 DeepSeek Harness，把分散的工作流程整合到统一工作台，并通过 Agent Loop 的钩子函数接入本地 AI 记忆等通用能力。',
      },
      'dsh-agent-teams-office': {
        description: '为 DeepSeek Harness 的 Agent Teams 功能提供 3D 与像素风的办公室展示，动画由真实消息与任务事件驱动。',
      },
      'dsh-theme-library': {
        description: '用于探索 Codex 对 3D 场景的处理能力，将实验中的部分场景提取为动态壁纸。',
      },
      'atlassian-server-mcp': {
        description: '面向公司内部本地部署的 Jira、Confluence 和 Bitbucket Data Center，让 AI 助手通过统一接口查询需求、检索知识文档并参与代码评审流程。默认以只读方式开放能力，可按配置逐步开放操作。',
      },
      'zaimokuza': {
        description: '本站自身的仓库：用 Vite、React 与 Tailwind v4 手工实现粒子肖像和观测，博客以 Markdown 独立维护、仓库数据通过 GitHub Workflow 更新，整站静态部署到 GitHub Pages，不需要后端。',
      }
    },
  },

  // 从星标仓库中挑出的展示清单，介绍同样根据公开 README 归纳
  starred: {
    title: '观测',
    switchLabel: '仓库列表',
    notFound: '没有找到这个仓库。',
    // 观测八块面板的标题，概况数据直接放在顶部卡片里
    panels: {
      calendar: '贡献日历',
      weekly: '每周提交量',
      languages: '语言构成',
      rhythm: '提交节律 · 星期 × 小时',
      readings: '节律读数',
      contributors: '贡献者',
      releases: '发布节奏',
      commits: '最近提交',
    },
    stats: {
      stars: '星标',
      perDay: '日均',
      forks: '分叉',
      watchers: '订阅',
      issues: '未关闭 Issue',
      commits: '累计提交',
      pushed: '最后推送',
    },
    tags: { built: '建于', site: '主页' },
    calendar: {
      rangeLabel: '近',
      weeksUnit: '周',
      commitsUnit: '次提交',
      busiestLabel: '最忙的一天',
      activeDaysLabel: '天有提交',
      longestLabel: '最长连续',
      currentLabel: '当前连续',
      daysUnit: '天',
      lessLabel: '少',
      moreLabel: '多',
      empty: 'GitHub 还没有为这个仓库算好逐周提交统计，稍后重新生成快照即可补上。',
    },
    weekly: {
      averageLabel: '周均',
      commitsUnit: '次',
      upLabel: '后半比前半多',
      downLabel: '后半比前半少',
    },
    rhythm: {
      timezone: '时区 UTC',
      quietPrefix: '底纹 = 最安静的',
      quietHoursUnit: '小时',
      sharePrefix: '只占',
    },
    readings: {
      peakLabel: '高峰',
      peakUnit: '次落在这一格',
      quietPrefix: '最安静的',
      quietHoursUnit: '小时',
      quietSharePrefix: '仅占',
      weekendLabel: '周末提交',
      weekendValue: '周六 + 周日',
      workLabel: '工作时间段',
      workValue: '周一至周五 9–18 点',
      sampleLabel: '样本',
      sampleValue: '时间基准 UTC',
      sampleUnit: '次提交',
      weekdayNames: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    },
    contributors: {
      headPrefix: '攒够一半提交需要',
      headPeopleUnit: '人',
      headTopPrefix: '前三人占',
      commitsUnit: '次',
      empty: '暂时没有可展示的贡献者数据。',
    },
    releases: {
      headPrefix: '近',
      headVersionsUnit: '个版本',
      headMedianPrefix: '中位间隔',
      prereleaseLabel: '预览',
      empty: '这个仓库还没有发布记录。',
    },
    commits: {
      headPrefix: '最新一条',
      empty: '暂时没有可展示的提交记录。',
    },
    relative: { today: '今天', yesterday: '昨天', daysAgo: '天前' },
    entries: {
      'deepseek-ai/deepseek-harness': {
        description: '面向希望把 Agent 拆成可替换部件的场景，以「一切皆插件」的方式组织模型接入、工具调用与会话界面，底层用 Cordis 管理插件的加载与生命周期，让同一套 Harness 既能沿用官方流程，也能把任意一层换成内部实现。',
      },
      'earendil-works/pi': {
        description: '面向需要把 Agent 能力嵌进自有产品的开发者，把统一的多模型接口、Agent 循环、终端界面和编码 Agent 命令行拆成可单独取用的包，并让 Agent 在运行中扩展自身能力，便于只借用其中一层，而不必整体替换现有技术栈。',
      },
      'openclaw/openclaw': {
        description: '面向希望助手跑在自己设备上的场景，安装后以常驻服务接入日常聊天渠道，用对话驱动本机的文件、命令与消息处理，安装脚本覆盖 macOS、Linux 与 Windows，数据留在本地而不是托管在别人的服务器上。',
      },
      'NousResearch/hermes-agent': {
        description: '面向希望 Agent 常驻本机、长期使用的场景，同时提供命令行、网关、终端界面与工具集，安装脚本会自动准备好 Python、Node 等运行时，Windows、WSL2 与 Android / Termux 都能直接跑起来，不用自己搭环境。',
      },
      'openai/codex': {
        description: '面向终端里的日常编码任务，以轻量进程在本地仓库中读写代码、执行命令并提交改动，把重复的修改与排查交给 Agent，同时保留对工作目录范围和审批策略的控制。',
      },
      'anthropics/claude-code': {
        description: '面向习惯在终端里工作的场景，以自然语言指令驱动读写代码、解释陌生实现并完成 Git 流程，把例行改动和排查交给 Agent，同时用权限确认保留对每一步操作的把关。',
      },
      'bytedance/deer-flow': {
        description: '面向需要数分钟到数小时才能完成的长程任务，用沙箱、记忆、工具、技能与子 Agent 组成可编排的流水线，先调研再编码再产出，并借消息网关把过程接入常用协作渠道。',
      },
    },
  },

  // 「开源作品」的卡片与「观测」的整页共用同一份指标标签，统一放在这里
  repoUI: {
    fallback: '介绍整理中，点击查看仓库文档与使用说明。',
    releaseLabel: '最新版本',
    prereleaseLabel: '预览版',
    nearLabel: '近',
    weeksUnit: '周',
    activityLabel: '提交活动',
    commitsLabel: '累计提交',
    forksLabel: 'Forks',
    issuesLabel: 'Issues',
    contributorsLabel: '贡献者',
  },

  // 工作与教育经历按时间倒序排列。
  experience: [
    {
      kind: 'work',
      period: '2021-07 — 至今',
      role: '全栈工程师',
      org: '华侨金信商业服务（深圳）有限公司上海分公司',
    },
    {
      kind: 'work',
      period: '2019-03 — 2021-06',
      role: '全栈工程师',
      org: '沈阳东硕信息技术有限公司',
    },
    {
      kind: 'work',
      period: '2017-08 — 2019-01',
      role: '研发工程师',
      org: '上海鲁班软件股份有限公司',
    },
    {
      kind: 'education',
      period: '2014 — 2018',
      role: '本科 · 物联网工程',
      org: '宿州学院',
    },
  ],
}
