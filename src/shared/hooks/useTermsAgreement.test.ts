import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TERMS_ID, TERMS_ITEMS } from '@/shared/constants/terms'
import { useTermsAgreement } from '@/shared/hooks/useTermsAgreement'

/**
 * 약관 연동 3규칙. 레거시 `watch` 3개를 각각 다른 도구로 옮긴 자리라
 * **변환이 맞는지 여기서 못 박는다** (`recipe.md` §5).
 */
describe('useTermsAgreement', () => {
  const render = () => {
    return renderHook(() => {
      return useTermsAgreement({ items: TERMS_ITEMS })
    })
  }

  it('처음에는 아무것도 동의되지 않았다', () => {
    const { result } = render()

    expect(result.current.isAllAgreed).toBe(false)
    expect(result.current.isAllRequiredAgreed).toBe(false)
    expect(result.current.consentQueryString).toBe(
      'marketingDataConsentFlag=false&receiveAdvertsConsentFlag=false',
    )
  })

  it('필수 2개만 체크해도 인증 버튼 조건이 충족된다', () => {
    const { result } = render()

    act(() => {
      result.current.changeAgreedState({
        [TERMS_ID.TERMS_AND_CONDITIONS]: true,
        [TERMS_ID.PRIVACY_POLICY]: true,
        [TERMS_ID.MARKETING_DATA_CONSENT]: false,
        [TERMS_ID.RECEIVE_ADVERTS_CONSENT]: false,
      })
    })

    expect(result.current.isAllRequiredAgreed).toBe(true)
    // 선택 2개가 남아 있으므로 `모두 동의`는 아니다
    expect(result.current.isAllAgreed).toBe(false)
  })

  it('규칙 1 — 개별 4개를 모두 체크하면 `모두 동의`가 따라 켜진다', () => {
    // 파생 상태다. useEffect로 옮기면 렌더가 한 번 더 돌아 중간 프레임이 어긋난다.
    const { result } = render()

    act(() => {
      result.current.changeAgreedState(
        Object.fromEntries(
          TERMS_ITEMS.map((item) => {
            return [item.id, true]
          }),
        ),
      )
    })

    expect(result.current.isAllAgreed).toBe(true)
  })

  it('규칙 2 — 마케팅 동의를 해제하면 광고성 수신도 함께 해제된다', () => {
    const { result } = render()

    act(() => {
      result.current.changeAgreedState({
        [TERMS_ID.MARKETING_DATA_CONSENT]: true,
        [TERMS_ID.RECEIVE_ADVERTS_CONSENT]: true,
      })
    })
    expect(result.current.agreedState[TERMS_ID.RECEIVE_ADVERTS_CONSENT]).toBe(true)

    // 마케팅만 끈다 — 광고성은 손대지 않았는데 함께 꺼져야 한다
    act(() => {
      result.current.changeAgreedState({
        [TERMS_ID.MARKETING_DATA_CONSENT]: false,
        [TERMS_ID.RECEIVE_ADVERTS_CONSENT]: true,
      })
    })

    expect(result.current.agreedState[TERMS_ID.RECEIVE_ADVERTS_CONSENT]).toBe(false)
  })

  it('규칙 3 — 광고성 수신을 체크하면 마케팅 동의가 함께 켜진다', () => {
    const { result } = render()

    act(() => {
      result.current.changeAgreedState({ [TERMS_ID.RECEIVE_ADVERTS_CONSENT]: true })
    })

    expect(result.current.agreedState[TERMS_ID.MARKETING_DATA_CONSENT]).toBe(true)
  })

  it('`모두 동의`를 누르면 전부 켜지고, 다시 누르면 전부 꺼진다', () => {
    const { result } = render()

    act(() => {
      result.current.toggleAllAgreed()
    })
    TERMS_ITEMS.forEach((item) => {
      expect(result.current.agreedState[item.id]).toBe(true)
    })

    act(() => {
      result.current.toggleAllAgreed()
    })
    TERMS_ITEMS.forEach((item) => {
      expect(result.current.agreedState[item.id]).toBe(false)
    })
  })

  it('선택 동의는 문자열로 직렬화된다 — KMC 왕복용', () => {
    // boolean을 그대로 두면 URL에 담기지 않는다. S2가 `=== 'true'`로 되돌린다.
    const { result } = render()

    act(() => {
      result.current.changeAgreedState({ [TERMS_ID.MARKETING_DATA_CONSENT]: true })
    })

    expect(result.current.consentQueryString).toBe(
      'marketingDataConsentFlag=true&receiveAdvertsConsentFlag=false',
    )
  })
})
