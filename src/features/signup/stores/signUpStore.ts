import { create } from 'zustand'

import type { SignUpInfoState } from '@/features/signup/types/signup'

/**
 * 가입 위저드 상태. 레거시 Pinia `stores/auth.js`의 `useSignUpInfoStore` 이식.
 *
 * **영속화하지 않는다.** 비밀번호가 들어 있고, 레거시도 메모리에만 뒀다.
 * KMC 외부 사이트를 왕복하는 구간만 URL 쿼리스트링으로 값을 나른다
 * (`useTermsAgreement`의 `consentQueryString`).
 *
 * ⚠️ **`setSignUpInfo`는 병합만 한다.** 레거시와 같다 — 그래서 `setSignUpInfo({})`로
 * 초기화하려던 호출 2곳이 실제로는 아무 일도 하지 않는다. 그 호출은 옮기지 않았고,
 * 초기화 기능도 만들지 않았다 (등가 이관 · `deferred.md` D-206).
 */
export const useSignUpStore = create<SignUpInfoState>((set, get) => {
  return {
    signUpInfo: {},

    setSignUpInfo: (signUpInfo) => {
      set({ signUpInfo: { ...get().signUpInfo, ...signUpInfo } })
    },
  }
})
