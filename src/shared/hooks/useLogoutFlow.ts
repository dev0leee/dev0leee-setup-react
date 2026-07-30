import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { RESIDENT_DETAIL_INFO_QUERY_KEY } from '@/shared/constants/query'
import { nativeLogoutApp } from '@/shared/lib/native/auth'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 로컬 세션 정리 → 앱 통보 → 화면 이동. 레거시 `lib/composables/useLogoutFlow.js` 이식.
 *
 * 서버 로그아웃 호출과 분리돼 있다. 서버 호출이 실패해도, 자동 로그인이 실패해도
 * 이 흐름은 그대로 실행돼야 하기 때문이다.
 *
 * ⚠️ **순서를 지킨다.** 캐시 제거 → 스토어 정리 → 네이티브 통보 → 이동.
 * 이동을 먼저 하면 다음 화면이 아직 남아 있는 토큰으로 요청을 보낸다.
 *
 * `features/auth`가 아니라 `shared/`에 있다. 로그인·로그아웃이라는 **동작**은 auth 도메인이지만
 * 이 함수는 "세션을 버린다"는 **하부구조 조작**이고, 세대 전출(`useResidentDetailInfo`)·
 * 회원 탈퇴(mypage)처럼 auth 밖에서도 부른다. feature가 feature를 import하지 않으려면
 * 여기 있어야 한다 (`01-folder-structure.md` "feature 간 의존").
 */
export const useLogoutFlow = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => {
    return state.clearAuth
  })
  const setShouldRedirectAfterLogin = useAuthStore((state) => {
    return state.setShouldRedirectAfterLogin
  })

  return useCallback(
    ({ path }: { path: string }) => {
      // 레거시가 지우는 캐시는 이 하나다. 나머지는 남긴다.
      queryClient.removeQueries({ queryKey: RESIDENT_DETAIL_INFO_QUERY_KEY })

      clearAuth()
      setShouldRedirectAfterLogin(true)
      nativeLogoutApp()

      void navigate(path)
    },
    [clearAuth, navigate, queryClient, setShouldRedirectAfterLogin],
  )
}
