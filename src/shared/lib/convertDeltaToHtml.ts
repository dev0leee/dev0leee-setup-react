import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html'

import { decodeUrl } from '@/shared/utils/decodeUrl'

/** Quill Delta의 op 하나. `insert`는 문자열이거나 임베드 객체다 */
interface DeltaOp {
  insert?: string | { image?: string; customImage?: { url?: string } }
  attributes?: Record<string, unknown>
}

/** 서버가 주는 본문은 Delta JSON 배열이거나 `{ ops: [...] }` 형태다 */
type ParsedDelta = DeltaOp[] | { ops?: DeltaOp[] }

/**
 * 게시글 본문·제목을 HTML로 바꾼다. 레거시 `lib/delta/convertDeltaToHtml.js` 이식.
 *
 * **서버가 세 가지 형식을 섞어 준다.** 관리자 도구가 바뀌어 오면서 쌓인 것이다:
 *
 * | 입력 시작    | 처리                                             |
 * | ------------ | ------------------------------------------------ |
 * | `[{` 또는 `{` | Quill Delta JSON → `quill-delta-to-html`로 변환   |
 * | `<`          | 이미 HTML — 그대로 반환                          |
 * | 그 외        | 평문 — `\r\n`을 `<br>`로만 바꾼다                |
 *
 * ⚠️ **파싱 전에 엔티티를 두 번 벗긴다.** `&quot;`와 `&#NN;`을 정규식으로 먼저 풀고,
 * 그다음 `decodeUrl`을 시도한다. 서버가 인코딩을 이중으로 걸어 보내는 경우가 있어
 * 레거시가 방어해 둔 것이다. `decodeUrl` 실패는 경고만 남기고 원본으로 계속한다.
 *
 * ⚠️ **`customImage` 블롯을 표준 `image`로 바꾼다.** 레거시 에디터가 쓰던 커스텀
 * 임베드라 변환기가 모른다. 이 처리가 없으면 본문 이미지가 통째로 사라진다.
 *
 * ⚠️ **반환이 `null`일 수 있다.** 파싱 실패거나 입력이 빈 값일 때다. 호출부는
 * `?? '정보없음'`으로 받는다 (`board.md` B2).
 *
 * 🔴 **최상위가 배열(`[{...}]`)인 Delta는 일부러 실패시킨다.** 레거시가
 * `parsedDelta.ops.some(...)`을 **배열 검사보다 먼저** 호출해 `undefined.some`으로
 * TypeError를 내고, catch에서 `null`을 돌려준다 → 화면에 `정보없음`이 뜬다.
 * (바로 아래 `Array.isArray(parsedDelta) ? ...` 분기는 그래서 **도달할 수 없는 죽은 코드**다.)
 * 고치면 지금까지 `정보없음`이던 글에 본문이 나타나 화면이 달라진다 —
 * 등가 이관이라 그대로 두고 `deferred.md` D-223에 남겼다.
 */
export const convertDeltaToHtml = ({ delta }: { delta: string | undefined }): string | null => {
  if (!delta) return null

  if (delta.startsWith('[{') || delta.startsWith('{')) {
    try {
      let processedDelta = delta
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (_match, dec: string) => {
          return String.fromCharCode(Number(dec))
        })

      try {
        processedDelta = decodeUrl({ url: processedDelta }) ?? processedDelta
      } catch {
        console.warn('URI decoding failed, using original string')
      }

      const parsedDelta = JSON.parse(processedDelta) as ParsedDelta

      // 레거시의 `parsedDelta.ops.some(...)`이 배열 입력에서 터지는 것을 그대로 재현한다.
      // 위 주석의 D-223 참조 — 고치면 화면이 달라진다.
      if (Array.isArray(parsedDelta)) {
        throw new TypeError("Cannot read properties of undefined (reading 'some')")
      }

      const ops = parsedDelta.ops ?? []

      const normalizedOps = ops.map((op) => {
        const customImageUrl =
          typeof op.insert === 'object' ? op.insert.customImage?.url : undefined

        if (customImageUrl === undefined) return op
        return { ...op, insert: { image: customImageUrl } }
      })

      return new QuillDeltaToHtmlConverter(normalizedOps, {}).convert()
    } catch (error) {
      console.error('내용 파싱 중 오류가 발생했습니다.', error)
      return null
    }
  }

  if (delta.startsWith('<')) return delta

  return delta.replace(/\r\n/g, '<br>') || null
}
