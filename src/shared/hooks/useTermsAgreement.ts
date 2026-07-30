import { useState } from 'react'

import { TERMS_ID } from '@/shared/constants/terms'
import type { TermsItem } from '@/shared/types/terms'

/**
 * 약관 동의 상태와 연동 규칙. 레거시 `lib/composables/useTermsAgreement.js` 이식.
 *
 * **`watch` 3개를 각각 다른 도구로 옮겼다** — `recipe.md` §5의 판단 기준을 적용한
 * 대표 사례다.
 *
 * | 레거시 `watch`                          | 하는 일          | React            |
 * | --------------------------------------- | ---------------- | ---------------- |
 * | 개별 전부 체크 → `모두 동의` 자동 체크   | 값에서 값을 계산 | **렌더 중 계산** |
 * | 마케팅 해제 → 광고성 수신도 해제        | 사용자 동작 반응 | 이벤트 핸들러    |
 * | 광고성 수신 체크 → 마케팅도 체크        | 〃               | 이벤트 핸들러    |
 *
 * 첫 번째를 `useEffect`로 옮기면 **렌더가 두 번 돌고** 중간 프레임에 체크박스가
 * 어긋난 상태가 보인다. `isAllAgreed`는 상태가 아니라 파생값이다.
 *
 * 아래 두 규칙은 **"마케팅 동의 없이는 광고 수신 불가"** 를 양방향으로 강제한다.
 * `watch`는 값의 **전이**에 반응하므로, 다음 상태와 이전 상태를 비교해 같은 조건을 만든다.
 */
export const useTermsAgreement = ({ items }: { items: TermsItem[] }) => {
  const [agreedState, setAgreedState] = useState<Record<string, boolean>>(() => {
    return Object.fromEntries(
      items.map((item) => {
        return [item.id, false]
      }),
    )
  })

  const isEveryChecked = items.every((item) => {
    return agreedState[item.id]
  })

  const isAllRequiredAgreed = items
    .filter((item) => {
      return item.required
    })
    .every((item) => {
      return agreedState[item.id]
    })

  /** 개별 항목 변경. 연동 규칙 2·3을 여기서 적용한다 */
  const changeAgreedState = (nextState: Record<string, boolean>) => {
    setAgreedState((prev) => {
      const next = { ...nextState }

      // 규칙 2 — 마케팅 동의가 켜짐 → 꺼짐으로 **전이**할 때만 광고성을 함께 끈다
      if (prev[TERMS_ID.MARKETING_DATA_CONSENT] && !next[TERMS_ID.MARKETING_DATA_CONSENT]) {
        next[TERMS_ID.RECEIVE_ADVERTS_CONSENT] = false
      }

      // 규칙 3 — 광고성 수신이 꺼짐 → 켜짐으로 전이할 때만 마케팅을 함께 켠다
      if (!prev[TERMS_ID.RECEIVE_ADVERTS_CONSENT] && next[TERMS_ID.RECEIVE_ADVERTS_CONSENT]) {
        next[TERMS_ID.MARKETING_DATA_CONSENT] = true
      }

      return next
    })
  }

  /** `모두 동의` 클릭. 현재 파생값의 반대로 전 항목을 일괄 설정한다 */
  const toggleAllAgreed = () => {
    const nextValue = !isEveryChecked

    setAgreedState(
      Object.fromEntries(
        items.map((item) => {
          return [item.id, nextValue]
        }),
      ),
    )
  }

  /**
   * 선택 약관 동의 여부를 KMC 콜백 URL에 실어 보낸다.
   *
   * ⚠️ **스토어로 대체할 수 없다.** KMC 외부 사이트를 왕복하는 동안 SPA가 죽으므로
   * 메모리 상태는 사라진다. `URLSearchParams`가 boolean을 `'true'`/`'false'` 문자열로
   * 직렬화하고, 콜백 화면(S2)이 다시 boolean으로 되돌린다.
   */
  const consentQueryString = new URLSearchParams({
    marketingDataConsentFlag: String(agreedState[TERMS_ID.MARKETING_DATA_CONSENT] ?? false),
    receiveAdvertsConsentFlag: String(agreedState[TERMS_ID.RECEIVE_ADVERTS_CONSENT] ?? false),
  }).toString()

  return {
    agreedState,
    /** 레거시 `isAllAgreed` — 별도 상태가 아니라 파생값이다 */
    isAllAgreed: isEveryChecked,
    isAllRequiredAgreed,
    changeAgreedState,
    toggleAllAgreed,
    consentQueryString,
  }
}
