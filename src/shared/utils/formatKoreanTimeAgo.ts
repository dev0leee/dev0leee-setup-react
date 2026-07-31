/**
 * vueuse `useTimeAgo`의 기본 단위 표. **레거시 `node_modules/@vueuse/core`에서 그대로 옮겼다**
 * — 임계값을 짐작하면 "45분 전"이 "1시간 전"으로 바뀌는 식의 어긋남이 생긴다.
 *
 * `max`는 "이 단위를 쓸 절대차 상한", `value`는 나눌 단위 크기다.
 */
const UNITS = [
  { max: 6e4, value: 1e3, name: 'second' },
  { max: 276e4, value: 6e4, name: 'minute' },
  { max: 72e6, value: 36e5, name: 'hour' },
  { max: 5184e5, value: 864e5, name: 'day' },
  { max: 24192e5, value: 6048e5, name: 'week' },
  { max: 28512e6, value: 2592e6, name: 'month' },
  { max: Number.POSITIVE_INFINITY, value: 31536e6, name: 'year' },
] as const

/** vueuse 기본 메시지. `past`가 숫자 없는 문자열(`yesterday`)에는 ` ago`를 붙이지 않는다 */
const toEnglish = ({
  name,
  value,
  isPast,
}: {
  name: string
  value: number
  isPast: boolean
}): string => {
  const plural = value > 1 ? 's' : ''

  if (name === 'day' && value === 1) return isPast ? 'yesterday' : 'tomorrow'
  if (name === 'week' && value === 1) return isPast ? 'last week' : 'next week'
  if (name === 'month' && value === 1) return isPast ? 'last month' : 'next month'
  if (name === 'year' && value === 1) return isPast ? 'last year' : 'next year'

  return `${String(value)} ${name}${plural}`
}

/** 레거시 `useKoreanTimeAgo`의 치환표. **순서가 결과를 바꾸므로 그대로 유지한다** */
const toKorean = (english: string): string => {
  return english
    .replace('just now', '방금 전')
    .replace(/(\d+) seconds? ago/, '$1초 전')
    .replace(/(\d+) minutes? ago/, '$1분 전')
    .replace(/(\d+) hours? ago/, '$1시간 전')
    .replace(/(\d+) days? ago/, '$1일 전')
    .replace(/(\d+) weeks? ago/, '$1주 전')
    .replace(/(\d+) months? ago/, '$1개월 전')
    .replace(/(\d+) years? ago/, '$1년 전')
    .replace('yesterday', '1일 전')
    .replace('last week', '1주 전')
    .replace('last month', '1개월 전')
    .replace('last year', '1년 전')
}

/**
 * 상대 시간을 한국어로. 레거시 `lib/composables/useKoreanTimeAgo.js` 이식.
 *
 * **레거시는 vueuse `useTimeAgo`로 영어를 만든 뒤 문자열 치환으로 한국어화한다.**
 * 여기서도 같은 2단계를 거친다 — 한국어를 바로 만들면 vueuse의 단위 경계·반올림을
 * 하나라도 잘못 짚었을 때 조용히 어긋난다. 영어 중간 단계를 두면 그 경계가 표로 남는다.
 *
 * | 경과 시간          | 결과       |
 * | ------------------ | ---------- |
 * | 1분 미만           | `방금 전`  |
 * | 46분 미만          | `N분 전`   |
 * | 20시간 미만        | `N시간 전` |
 * | 6일 미만           | `N일 전`   |
 * | 28일 미만          | `N주 전`   |
 * | 11개월 미만        | `N개월 전` |
 * | 그 이상            | `N년 전`   |
 *
 * ⚠️ **초 단위는 나오지 않는다.** vueuse 기본값이 `showSecond: false`라 1분 미만은
 * 전부 `방금 전`이다 — 레거시의 `(\d+) seconds? ago` 치환은 실제로 발동하지 않는다.
 *
 * ⚠️ **미래 시각은 영어로 남는다.** vueuse가 `in 5 minutes`·`tomorrow`를 만드는데
 * 레거시 치환표에 `ago` 패턴과 과거 표현만 있어 매칭되지 않는다. 게시글이 미래일 수
 * 없어 실제로는 드러나지 않지만, 서버 시계가 앞서 있으면 1분 이내는 `방금 전`으로 흡수된다.
 *
 * ⚠️ 값이 없으면 **`시간 없음`**을 준다 (빈 문자열이 아니다).
 */
export const formatKoreanTimeAgo = ({
  dateString,
  now,
}: {
  dateString: string | undefined
  now: number
}): string => {
  if (!dateString) return '시간 없음'

  const from = new Date(dateString).getTime()
  if (Number.isNaN(from)) return ''

  const diff = now - from
  const absDiff = Math.abs(diff)
  const isPast = diff > 0

  // vueuse: `absDiff < 6e4 && !showSecond` → justNow
  if (absDiff < 6e4) return toKorean('just now')

  const unit = UNITS.find((candidate) => {
    return absDiff < candidate.max
  })
  if (!unit) return ''

  const value = Math.round(absDiff / unit.value)
  const english = toEnglish({ name: unit.name, value, isPast })

  // vueuse `past`/`future` 규칙 — 숫자가 없는 표현(`yesterday`)은 그대로 둔다
  if (!/\d/.test(english)) return toKorean(english)

  return toKorean(isPast ? `${english} ago` : `in ${english}`)
}
