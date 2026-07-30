import DOMPurify from 'dompurify'

/**
 * 서버·사용자에게서 온 HTML을 살균한다.
 * 레거시 `v-dompurify-html` 디렉티브(31곳)를 대체한다.
 *
 * `dangerouslySetInnerHTML`에 넣기 전에 **반드시** 이 함수를 통과시킨다.
 * 살균하지 않은 문자열을 넣는 곳이 하나라도 생기면 XSS 표면이 열린다.
 */
export const sanitizeHtml = ({ html }: { html: string }): string => {
  return DOMPurify.sanitize(html)
}
