import { profile } from '../data/profile'

/** 页脚只剩右下角的手写签名；站外入口由顶部导航承担。 */
export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-frame site-footer">
      <p className="footer-sign">© {year}. {profile.name}</p>
    </footer>
  )
}
