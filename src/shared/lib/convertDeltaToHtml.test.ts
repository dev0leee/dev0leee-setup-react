import { describe, expect, it, vi } from 'vitest'

import { convertDeltaToHtml } from '@/shared/lib/convertDeltaToHtml'

/**
 * 게시글 본문 변환. 서버가 세 가지 형식을 섞어 주고 레거시가 그중 하나에서
 * **일부러 실패한다.** 그 실패까지 이관 대상이라 못박아 둔다.
 */
describe('convertDeltaToHtml', () => {
  it('`{ops:[...]}` Delta를 HTML로 바꾼다', () => {
    const delta = JSON.stringify({ ops: [{ insert: '안녕하세요\n' }] })

    expect(convertDeltaToHtml({ delta })).toBe('<p>안녕하세요</p>')
  })

  it('서식 속성을 살린다', () => {
    const delta = JSON.stringify({
      ops: [{ insert: '굵게', attributes: { bold: true } }, { insert: '\n' }],
    })

    expect(convertDeltaToHtml({ delta })).toContain('<strong>굵게</strong>')
  })

  it('`customImage` 블롯을 표준 이미지로 바꾼다', () => {
    // 이 변환이 없으면 본문 이미지가 통째로 사라진다
    const delta = JSON.stringify({
      ops: [{ insert: { customImage: { url: 'https://cdn.test/a.png' } } }],
    })

    expect(convertDeltaToHtml({ delta })).toContain('src="https://cdn.test/a.png"')
  })

  it('`&quot;`로 이스케이프된 Delta도 파싱한다', () => {
    const delta = '{&quot;ops&quot;:[{&quot;insert&quot;:&quot;안녕\\n&quot;}]}'

    expect(convertDeltaToHtml({ delta })).toBe('<p>안녕</p>')
  })

  it('🔴 최상위가 배열인 Delta는 실패해 null이다 — 레거시 동작', () => {
    // 레거시가 `parsedDelta.ops.some(...)`을 배열 검사보다 먼저 불러 터진다.
    // 화면에는 `정보없음`이 뜬다 (`deferred.md` D-223).
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
      // 의도된 실패라 로그를 삼킨다
    })

    expect(convertDeltaToHtml({ delta: '[{"insert":"안녕"}]' })).toBeNull()

    consoleError.mockRestore()
  })

  it('이미 HTML이면 그대로 돌려준다', () => {
    expect(convertDeltaToHtml({ delta: '<p>이미 HTML</p>' })).toBe('<p>이미 HTML</p>')
  })

  it('평문은 `\\r\\n`만 `<br>`로 바꾼다', () => {
    expect(convertDeltaToHtml({ delta: '첫줄\r\n둘째줄' })).toBe('첫줄<br>둘째줄')
  })

  it('빈 값이면 null이다', () => {
    expect(convertDeltaToHtml({ delta: undefined })).toBeNull()
    expect(convertDeltaToHtml({ delta: '' })).toBeNull()
  })
})
