import { create } from 'zustand'

import { LEGACY_ORPHAN_STORAGE_KEY, STORAGE_KEY } from '@/shared/constants/storage'
import { clearTokens } from '@/shared/lib/tokenStore'
import type { AptInfo, AuthState, UserAuthInfo } from '@/shared/types/auth'

/**
 * 레거시 `stores/authPermission.js` + `useAuthStorage.js` 이관.
 *
 * 토큰은 여기 넣지 않는다 — `shared/lib/tokenStore.ts`가 소유한다.
 * 이 스토어는 **토큰이 아닌 인증 부수 상태**와 **단지 컨텍스트**를 담는다.
 *
 * ⚠️ 두 가지가 타깃 컨벤션과 어긋나지만 등가 이관을 위해 유지한다:
 *  - `userAuthInfo`(아이디·비밀번호 평문)를 localStorage에 둔다 (`deferred.md` D-15)
 *  - `aptInfo`는 서버 데이터인데 localStorage에 복사한다 (`deferred.md` D-35)
 */

/** localStorage의 JSON 값을 읽는다. 깨진 값이 앱을 못 띄우게 만들지 않는다. */
const readJson = <T>(key: string): T | null => {
  const raw = localStorage.getItem(key)
  if (!raw) return null

  try {
    return JSON.parse(raw) as T
  } catch (error) {
    console.warn(`[authStore] ${key} 파싱에 실패했습니다.`, error)
    return null
  }
}

const writeJson = (key: string, value: unknown): void => {
  if (value === null) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, JSON.stringify(value))
}

export const useAuthStore = create<AuthState>((set, get) => {
  return {
    // 부팅 시 localStorage에서 한 번 읽는다. 이후로는 스토어가 단일 출처다.
    userAuthInfo: readJson<UserAuthInfo>(STORAGE_KEY.USER_AUTH_INFO),
    // 레거시 `getAptInfo()`가 값이 없을 때 `{}`를 준다. 그 계약을 그대로 맞춘다.
    aptInfo: readJson<AptInfo>(STORAGE_KEY.APT_INFO) ?? {},
    isAutoLoginInProgress: false,
    // 레거시 기본값이 true다. 자동 로그인 중에만 false로 내린다.
    shouldRedirectAfterLogin: true,

    setUserAuthInfo: (userAuthInfo) => {
      writeJson(STORAGE_KEY.USER_AUTH_INFO, userAuthInfo)
      set({ userAuthInfo })
    },

    updateUserPassword: (password) => {
      const { userAuthInfo } = get()
      // 레거시도 저장된 정보가 없으면 아무것도 하지 않는다.
      if (!userAuthInfo) return

      const next = { ...userAuthInfo, password }
      writeJson(STORAGE_KEY.USER_AUTH_INFO, next)
      set({ userAuthInfo: next })
    },

    setAutoLoginInProgress: (isAutoLoginInProgress) => {
      set({ isAutoLoginInProgress })
    },

    setShouldRedirectAfterLogin: (shouldRedirectAfterLogin) => {
      set({ shouldRedirectAfterLogin })
    },

    /**
     * ⚠️ **병합이지 교체가 아니다.** 호출부들이 일부 필드만 넘긴다
     * (`usePatchMypageProfile`은 이름 2개, `useChangeApt`는 단지 3개).
     * 교체로 바꾸면 나머지 필드가 사라진다.
     */
    setAptInfo: (aptInfo) => {
      const next = { ...get().aptInfo, ...aptInfo }
      writeJson(STORAGE_KEY.APT_INFO, next)
      set({ aptInfo: next })
    },

    clearAptInfo: () => {
      localStorage.removeItem(STORAGE_KEY.APT_INFO)
      set({ aptInfo: {} })
    },

    /**
     * 레거시 `clearAuth()`. 지우는 키 목록까지 그대로다 — 지금 아무도 읽지 않는
     * `authUser`·`auth`도 함께 지운다(기존 사용자 기기에 남아 있을 수 있다).
     */
    clearAuth: () => {
      clearTokens()
      writeJson(STORAGE_KEY.USER_AUTH_INFO, null)
      localStorage.removeItem(STORAGE_KEY.APT_INFO)
      localStorage.removeItem(STORAGE_KEY.AUTH_USER)
      localStorage.removeItem(LEGACY_ORPHAN_STORAGE_KEY)

      set({ userAuthInfo: null, aptInfo: {}, isAutoLoginInProgress: false })
    },
  }
})

/**
 * 렌더 밖(인터셉터·유틸)에서 단지 컨텍스트를 읽는다. 레거시 `getAptInfo()`와 같다.
 * 컴포넌트 안에서는 훅 셀렉터를 쓴다 — 그래야 값이 바뀔 때 리렌더된다.
 */
export const getAptInfo = (): AptInfo => {
  return useAuthStore.getState().aptInfo
}
