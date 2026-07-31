/**
 * ISO 날짜 문자열을 화면 표기로 자른다. 레거시 `lib/utils/formatDate.js`의
 * `formatIsoStringDate` 이식.
 *
 * ⚠️ **파싱하지 않고 `slice`로 잘라낸다.** `new Date()`를 거치지 않으므로
 * **타임존 변환이 일어나지 않는다** — 서버가 준 문자열을 그대로 보여준다.
 * `date-fns`로 바꾸면 UTC 문자열이 로컬 시간으로 밀려 날짜가 하루 달라질 수 있다.
 * 그래서 레거시 구현을 유지한다.
 *
 * ⚠️ 값이 없으면 각 포맷터가 **`undefined`를 반환**한다(빈 문자열이 아니다).
 * 화면에서는 아무것도 렌더되지 않는다 — 레거시와 같다.
 *
 * ```ts
 * formatIsoStringDate({ dateTimeString: '2026-07-31T09:05:00' }).date()  // '2026-07-31'
 * formatIsoStringDate({ dateTimeString: undefined }).date()              // undefined
 * ```
 */
export const formatIsoStringDate = ({ dateTimeString }: { dateTimeString?: string }) => {
  if (!dateTimeString) {
    return {
      full: () => {
        return undefined
      },
      short: () => {
        return undefined
      },
      date: () => {
        return undefined
      },
      dateTime: () => {
        return undefined
      },
      dotDate: () => {
        return undefined
      },
    }
  }

  const year = dateTimeString.slice(0, 4)
  const month = dateTimeString.slice(5, 7)
  const day = dateTimeString.slice(8, 10)
  const hours = dateTimeString.slice(11, 13)
  const minutes = dateTimeString.slice(14, 16)
  // 초가 잘려 온 문자열도 있어 레거시가 `'00'`으로 보정한다
  const seconds = dateTimeString.slice(17, 19) || '00'

  return {
    full: () => {
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    short: () => {
      return `${month}-${day} ${hours}:${minutes}`
    },
    date: () => {
      return `${year}-${month}-${day}`
    },
    dateTime: () => {
      return `${year}-${month}-${day} ${hours}:${minutes}`
    },
    dotDate: () => {
      return `${year}.${month}.${day}`
    },
  }
}
