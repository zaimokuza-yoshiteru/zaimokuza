// 站外链接的角标箭头：缩小并上移到文字右上角，作为可访问性隐藏的装饰。
// 自绘而不是用 ↗ 字符，是为了让斜杆长度可控；viewBox 0 0 10 10 对应 1em 的方盒，
// 盒底压在基线上，墨迹落在 y 2.61～10.19、x 1.21～8.79，尺寸和位置由 .ext-arrow 决定。
export function ExternalArrow() {
  return (
    <svg className="ext-arrow" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d="M2.96 3.16H8.24V8.44M1.76 9.64L8.24 3.16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
