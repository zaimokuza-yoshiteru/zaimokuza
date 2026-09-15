import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { profile } from '../data/profile'
import { blogHref } from '../lib/navigation'
import { useActiveSection } from '../hooks/useActiveSection'
import BackToTop from './BackToTop'

// 正文和示例不进入首页包，文章页打开后才加载。
const articles = import.meta.glob<string>('../data/articles/*.md', { query: '?raw', import: 'default' })
const exampleText = import.meta.glob<string>('../data/articles/examples/*.{py,ts}', { query: '?raw', import: 'default', eager: true })
const exampleUrls = import.meta.glob<string>('../data/articles/examples/*.{py,ts}', { query: '?url', import: 'default', eager: true })
const ui = profile.articleUI

function CodeBlock({ code, language, toolbar, panelId, labelledBy }: { code: string; language: string; toolbar?: ReactNode; panelId?: string; labelledBy?: string }) {
  const [status, setStatus] = useState('')
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timeout.current), [])
  useEffect(() => { setStatus(''); clearTimeout(timeout.current) }, [code])
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setStatus(ui.copied) }
    catch { setStatus(ui.copyFailed) }
    clearTimeout(timeout.current)
    timeout.current = setTimeout(() => setStatus(''), 2400)
  }
  return <div className="article-code">
    <div className="article-code-toolbar">{toolbar ?? <span className="font-mono-num">{language || ui.sourceCode}</span>}
      <button type="button" onClick={copy}>{ui.copy}</button>
    </div>
    <pre tabIndex={0} id={panelId} role={panelId ? 'tabpanel' : undefined} aria-labelledby={labelledBy} aria-label={panelId ? undefined : `${language} ${ui.sourceCode}`}><code>{code}</code></pre>
    <span className="sr-only" role="status">{status}</span>
    {status && <p className="code-copy-feedback" aria-hidden="true">{status}</p>}
  </div>
}

function Example({ name }: { name: string }) {
  const [language, setLanguage] = useState<'py' | 'ts'>('py')
  const id = useId()
  const path = `../data/articles/examples/${name}.${language}`
  const code = exampleText[path]
  if (!code) return <p role="alert">{ui.loadFailed}</p>
  return <div className="article-example">
    <p className="example-caption">{ui.examples}</p>
    <CodeBlock code={code.trimEnd()} language={language === 'py' ? 'Python' : 'TypeScript'} panelId={`${id}-panel`} labelledBy={`${id}-${language}`} toolbar={
      <div role="tablist" aria-label={`${name} ${ui.examples}`} className="code-tabs">
        {(['py', 'ts'] as const).map((lang) => <button key={lang} type="button" role="tab"
          id={`${id}-${lang}`} aria-selected={lang === language} aria-controls={`${id}-panel`} tabIndex={lang === language ? 0 : -1}
          onClick={() => setLanguage(lang)} onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const next = event.key === 'Home' ? 'py' : event.key === 'End' ? 'ts' : language === 'py' ? 'ts' : 'py'
            setLanguage(next)
            document.getElementById(`${id}-${next}`)?.focus()
          }}>{lang === 'py' ? 'Python' : 'TypeScript'}</button>)}
      </div>
    } />
    <div className="example-run">
      <code>{language === 'py' ? `python3 ${name}.py` : `node ${name}.ts`}</code>
      <a href={exampleUrls[path]} download={`${name}.${language}`}>{ui.download} <span aria-hidden="true">↓</span></a>
    </div>
  </div>
}

function Pre({ children }: { children?: ReactNode }) {
  const child = Children.toArray(children)[0]
  if (!isValidElement<{ className?: string; children?: ReactNode }>(child)) return <pre>{children}</pre>
  const language = child.props.className?.replace('language-', '') ?? ''
  const code = String(child.props.children ?? '').trimEnd()
  return language === 'example' ? <Example name={code} /> : <CodeBlock code={code} language={language} />
}

export default function BlogArticle({ slug }: { slug: string }) {
  const post = profile.blog.posts.find((entry) => encodeURIComponent(entry.slug) === slug)
  const [body, setBody] = useState<string>()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const articleRef = useRef<HTMLElement>(null)
  const activeSection = useActiveSection(articleRef, body)
  useEffect(() => {
    let cancelled = false
    setFailed(false)
    if (!post?.article) return
    const load = articles[`../data/articles/${post.article}.md`]
    if (!load) { setFailed(true); return }
    load().then((text) => { if (!cancelled) setBody(text) }, () => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [post, attempt])
  const headings = useMemo(() => body ? Array.from(body.matchAll(/^## (.+)$/gm), (match, index) => ({ title: match[1], id: `article-section-${index}` })) : [], [body])
  // 高亮变化只更新目录，避免重建正文节点而丢失焦点或示例状态。
  const markdownComponents = useMemo<Components>(() => ({
    pre: Pre,
    h2: ({ children }) => <h2 tabIndex={-1} id={headings.find((heading) => heading.title === String(children))?.id}>{children}</h2>,
    table: ({ children }) => <div className="article-table-scroll" role="region" aria-label={ui.comparison} tabIndex={0}><table>{children}</table></div>,
    img: ({ src, alt }) => {
      const url = src?.startsWith('blog/') ? `${import.meta.env.BASE_URL}${src}` : src
      return <a href={url} target="_blank" rel="noopener noreferrer"><img className="article-sketch" loading="lazy" src={url} alt={alt ?? ''} /></a>
    },
    a: ({ href, children }) => <a href={href} target={href?.startsWith('https://') ? '_blank' : undefined} rel={href?.startsWith('https://') ? 'noopener noreferrer' : undefined}>{children}</a>,
  }), [headings])
  const jump = (id: string) => {
    const target = document.getElementById(id)
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }
  const toc = <ol>{headings.map((heading) => <li key={heading.id}><button type="button" aria-current={activeSection === heading.id ? 'location' : undefined} onClick={() => jump(heading.id)}>{heading.title}</button></li>)}</ol>
  return <article ref={articleRef} className="blog-article article-shell">
    <a className="back-link" href={blogHref()}><span aria-hidden="true">←</span> {profile.blog.back}</a>
    {!post ? <h1>{profile.blog.notFound}</h1> : <>
      <header className="article-header" id="article-top" tabIndex={-1}>
        <div className="article-meta"><time dateTime={post.date} className="font-mono-num">{post.date}</time><span>{post.category}</span>{post.readingMinutes && <span>{post.readingMinutes} {ui.minutes}</span>}</div>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
      </header>
      <div className="article-layout">
        {headings.length > 0 && <aside className="article-toc"><nav aria-label={ui.contents}><p>{ui.contents}</p>{toc}</nav></aside>}
        <div className="article-main">
          {headings.length > 0 && <details className="article-toc-mobile"><summary>{ui.contents}</summary><nav aria-label={ui.contents}>{toc}</nav></details>}
          {failed ? <p role="alert">{ui.loadFailed} <button type="button" className="collection-more" onClick={() => setAttempt((value) => value + 1)}>{ui.retry}</button></p> : post.article && body === undefined ? <p role="status">{ui.loading}</p> : <div className="article-prose">
            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{body ?? post.paragraphs?.join('\n\n') ?? ''}</Markdown>
          </div>}
          {body && <button type="button" className="collection-more article-back-top" onClick={() => jump('article-top')}>{ui.top} ↑</button>}
        </div>
      </div>
      <BackToTop label={ui.backToTop} focusTargetId="article-top" />
    </>}
  </article>
}
