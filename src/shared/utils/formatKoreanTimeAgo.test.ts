import { describe, expect, it } from 'vitest'

import { formatKoreanTimeAgo } from '@/shared/utils/formatKoreanTimeAgo'

/**
 * **기대값을 손으로 쓰지 않았다.** 레거시 레포의 실제 `@vueuse/core`에
 * `formatTimeAgo`를 돌리고 레거시 치환 체인을 적용한 결과를 그대로 옮겼다.
 * 단위 경계와 반올림을 짐작하면 `45분`이 `1시간`으로 밀리는 식으로 조용히 어긋난다.
 *
 * 기준 시각 `2026-07-31T12:00:00Z`, 값은 "몇 밀리초 전인가".
 */

const NOW = new Date('2026-07-31T12:00:00Z').getTime()

/** 레거시 vueuse 실측 결과 — `[경과 밀리초, 기대 문자열]` */
const GROUND_TRUTH: [number, string][] = [
  [0, '방금 전'],
  [30_000, '방금 전'],
  [59_000, '방금 전'],
  [60_000, '1분 전'],
  [2_700_000, '45분 전'],
  // ⚠️ 45분 59초는 반올림돼 `46분 전`이다 — 경계가 46분이라 아직 분 단위다
  [2_759_000, '46분 전'],
  [2_760_000, '1시간 전'],
  [68_400_000, '19시간 전'],
  [72_000_000, '1일 전'],
  [86_400_000, '1일 전'],
  [259_200_000, '3일 전'],
  [432_000_000, '5일 전'],
  [518_400_000, '1주 전'],
  [2_332_800_000, '4주 전'],
  [2_419_200_000, '1개월 전'],
  [25_920_000_000, '10개월 전'],
  [29_376_000_000, '1년 전'],
  [69_120_000_000, '2년 전'],
]

describe('formatKoreanTimeAgo', () => {
  it('값이 없으면 `시간 없음`이다', () => {
    expect(formatKoreanTimeAgo({ dateString: undefined, now: NOW })).toBe('시간 없음')
  })

  it.each(GROUND_TRUTH)('%d ms 전 → %s', (elapsedMs, expected) => {
    const dateString = new Date(NOW - elapsedMs).toISOString()

    expect(formatKoreanTimeAgo({ dateString, now: NOW })).toBe(expected)
  })

  it('⚠️ 미래 시각은 영어로 남는다 — 레거시 치환표에 미래 표현이 없다', () => {
    const future = new Date(NOW + 5 * 60 * 60 * 1000).toISOString()

    expect(formatKoreanTimeAgo({ dateString: future, now: NOW })).toBe('in 5 hours')
  })

  it('시계가 조금 앞서 있어도 1분 이내면 `방금 전`으로 흡수된다', () => {
    const slightFuture = new Date(NOW + 10_000).toISOString()

    expect(formatKoreanTimeAgo({ dateString: slightFuture, now: NOW })).toBe('방금 전')
  })
})
