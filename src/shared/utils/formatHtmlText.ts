import { decodeUrl } from '@/shared/utils/decodeUrl'

/**
 * 줄바꿈을 `<br/>`로 바꾼다. 레거시 `lib/utils/formatHtmlText.js` 이식.
 *
 * ⚠️ **결과는 HTML이다.** 렌더할 때 반드시 `sanitizeHtml`을 거쳐
 * `dangerouslySetInnerHTML`에 넣는다. 그냥 텍스트로 출력하면 `<br/>`이 글자로 보인다.
 */
export const formatHtmlText = ({ text }: { text: string | undefined }): string => {
  return decodeUrl({ url: text })?.replaceAll(/\n/g, '<br/>') ?? ''
}
