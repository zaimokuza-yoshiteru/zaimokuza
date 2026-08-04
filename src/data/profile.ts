/**
 * 个人信息 —— 修改此文件即可更新全站内容。
 */

/** 经历要点（每段经历下的项目条目） */
export interface Highlight {
  period?: string
  title: string
  detail: string
  tags?: string[]
}

/** 一段经历（教育经历的 highlights 为空数组） */
export interface ExperienceItem {
  period: string
  role: string
  org: string
  highlights: Highlight[]
}

/** 双语文案：页面默认英文，Hero 黑圈内显示中文 */
export interface Bilingual {
  en: string
  zh: string
}

export interface Profile {
  name: string
  heroTitle: Bilingual
  tagline: Bilingual
  bio: Bilingual
  location: Bilingual
  social: {
    github: string
    email?: string
  }
  experience: ExperienceItem[]
}

export const profile: Profile = {
  // 展示名（导航左侧 / 页脚，Georgia 衬线西文）
  name: 'Zaimokuza',
  // Hero 大标题与一句话定位：默认英文，鼠标移入显示中文
  heroTitle: { en: "Hi, I'm Zaimokuza", zh: '你好，我是 Zaimokuza' },
  tagline: {
    en: 'Full-Stack Engineer',
    zh: '全栈工程师',
  },
  // Hero 下方一段简介：默认英文，黑圈内中文
  bio: {
    en: 'About 9 years of full-stack experience. Currently building core banking systems with React & Spring Boot at a foreign bank; previously maintained company-wide base services. Also built MCP services and several AI applications at work.',
    zh: '约 9 年全栈开发经验，目前在外资银行负责基于 React 与 Spring Boot 的核心业务系统，也维护过公司级基础服务。在公司搭建过 MCP 服务和多个 AI 应用。',
  },
  location: { en: 'Shanghai, China', zh: '中国 · 上海' },

  social: {
    github: 'https://github.com/zaimokuza-yoshiteru',
    email: 'heshuang6571@163.com',
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
            '柜员为客户办理转账、贷款等全量银行业务的核心系统，双屏通过 WebSocket 实时协同；承担前后端全栈开发（React + Spring Boot 4）。主导 OCR 识别从传统方案升级为基于 GPT 的 AI 方案（后续计划切换至亚马逊云服务），覆盖方案选型、落地与效果验证。',
          tags: ['React', 'Spring Boot 4', 'WebSocket', 'GPT', 'OCR'],
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
