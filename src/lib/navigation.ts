// 使用哈希页面地址，让 GitHub Pages 子路径下的深链接无需服务器重写。
export const homeHref = (section = '') => `${import.meta.env.BASE_URL}${section ? `#${section}` : ''}`
export const blogHref = (slug?: string) => `${import.meta.env.BASE_URL}#/blog${slug ? `/${encodeURIComponent(slug)}` : ''}`
