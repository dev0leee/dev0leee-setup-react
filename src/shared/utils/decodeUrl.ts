import { decode } from 'he'

/**
 * HTML 엔티티와 URL 인코딩을 함께 벗긴다. 레거시 `lib/he/decodeUrl.js` 이식.
 *
 * 첨부파일 이름이 서버에서 `%ED%95%9C%EA%B8%80` + `&amp;` 형태로 섞여 온다.
 * `decodeURIComponent`가 실패하는 값(`%`가 홀로 있는 등)이 있어 **엔티티만 벗긴
 * 결과로 폴백한다** — 던지면 파일 목록 전체가 안 그려진다.
 */
export const decodeUrl = ({ url }: { url: string | undefined }): string | null => {
  if (!url) return null

  const decodedHtml = decode(url)

  try {
    return decodeURIComponent(decodedHtml)
  } catch {
    return decodedHtml
  }
}
