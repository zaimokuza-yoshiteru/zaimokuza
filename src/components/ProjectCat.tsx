import { profile } from '../data/profile'
import { useMascot } from '../hooks/useMascot'
import { resetTilt, tiltSurface } from '../tilt'

/** 参考咖波品牌形象重绘分层矢量，保持大脸、粗轮廓与短足的漫画比例。 */
export default function ProjectCat() {
  const { ref, visible, active, greet } = useMascot()
  const copy = profile.projects.cat
  return (
    <div className="project-cat">
      <button ref={ref} type="button" onClick={greet}
        onPointerMove={tiltSurface} onPointerLeave={resetTilt} onPointerCancel={resetTilt}
        className={`cat-button mascot ${visible ? 'is-visible' : ''} ${active ? 'is-active' : ''}`}
        data-cursor="cat" aria-label={copy.label} aria-describedby="cat-hint">
        <svg className="mascot-art" viewBox="0 0 320 240" aria-hidden="true">
          <ellipse cx="164" cy="213" rx="112" ry="9" fill="#766650" opacity="0.1" />
          <g className="capoo-body" stroke="#363636" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <g fill="#6fb6dc">
              <path d="M106 188q-4 24 8 24q12 0 13-21M181 186q0 25 12 24q11-1 13-26M250 172q0 28 11 27q11-2 14-30" />
            </g>
            <path fill="#86c9ed" d="M48 87Q63 21 83 24Q96 23 124 58L100 90ZM163 65Q201 21 218 28Q235 31 245 99Z" />
            <path fill="#86c9ed" d="M48 87Q91 49 159 54Q222 56 245 99Q261 104 284 98Q306 95 303 143Q303 178 293 195Q282 207 274 190L262 194Q255 220 242 213Q236 207 234 198L215 201Q208 226 193 216L187 203Q132 213 88 202Q82 225 68 215Q63 209 63 198Q21 179 24 141Q26 112 48 87Z" />
            <path d="M258 104q4 16 7 10M273 107q4 16 6 7M287 105q4 14 5 9" stroke="#4b9dc5" strokeWidth="7" />
            <path d="M245 99Q264 130 250 160" fill="none" />
            <path d="M85 202Q130 178 188 203Q137 213 85 202" fill="#eef6f7" stroke="none" />
            <path d="M80 202Q129 213 192 203" fill="none" />
            <g fill="#363636" stroke="none">
              <ellipse className="mascot-eye" cx="73" cy="135" rx="14" ry="19" />
              <ellipse className="mascot-eye" cx="204" cy="136" rx="14" ry="19" />
              <path d="M116 141Q123 161 139 144Q153 162 161 141" fill="none" stroke="#363636" strokeWidth="5.5" />
            </g>
            <g className="capoo-blush" fill="#e899ab" stroke="none">
              <ellipse cx="48" cy="160" rx="12" ry="5" /><ellipse cx="225" cy="160" rx="12" ry="5" />
            </g>
          </g>
        </svg>
      </button>
      <p id="cat-hint" className="cat-hint" aria-live="polite">{active ? copy.greeting : copy.hint}</p>
    </div>
  )
}
