import { redirect } from 'react-router-dom'

import { getLoginInfo } from '@/features/auth'
import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { hasAptContent } from '@/shared/lib/aptContext'
import { hasStoredSession } from '@/shared/lib/authSession'
import { nativeSendInitialResidentInfo } from '@/shared/lib/native/auth'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 이미 로그인한 사용자가 공개 화면에 들어오면 메인으로 보낸다.
 * 레거시 `router.beforeEach` 4단계(`requiresAuth === false && 세션 있음`) 이관.
 *
 * **컴포넌트가 아니라 `loader`인 이유**: 레거시 가드가 `await getLoginInfo()`로
 * **이동 전에** 서버에 다녀온다. 컴포넌트로 만들면 화면이 한 번 그려진 뒤 사라져
 * 인트로가 깜빡이고, `IntroPage`의 `clearAuth()`가 먼저 돌아 세션이 지워진다.
 * `loader`는 렌더 전에 돌고 `redirect()`로 이동을 가로챌 수 있어 vue-router의
 * 비동기 가드와 실행 시점이 같다.
 *
 * ⚠️ **왕복의 목적이 리다이렉트 판단이 아니다.** 네이티브에 `SEND_INITIAL_RESIDENT_INFO`를
 * 보내는 것이 목적이다(레거시 주석 `#20`) — 토큰이 남아 있어 자동으로 메인에 들어가는
 * 경로에서도 앱이 입주민 정보를 받아야 한다. 그래서 세션이 있으면 매번 호출한다.
 *
 * ⚠️ **실패 시 `clearAuth()`한다.** 레거시 주석대로 무한 루프 방지다 — 세션을 남겨두면
 * 인트로로 보내도 이 로더가 다시 돌아 또 실패한다.
 *
 * ⚠️ 이 로더를 **`authOptional` 라우트(`/error`)에는 걸지 않는다.** 레거시 가드가
 * 그 플래그를 보면 다른 검사를 전부 건너뛴다.
 */
export const publicRouteLoader = async () => {
  if (!hasStoredSession()) return null

  try {
    const loginInfo = await getLoginInfo()

    const hasLobbyPhone = hasAptContent({
      contentList: loginInfo?.contentList,
      contentName: APT_CONTENT_NAME.LOBBY_PHONE,
    })

    // 레거시는 이 발신 로직을 가드와 `useLoginData`에 두 번 복사해뒀고, **가드 쪽만
    // A-PASS 판정에서 `.trim()`이 빠져 있다.** 두 곳이 서로 다르니 어느 쪽도 "정답"이
    // 아니어서, 주 경로인 `useLoginData`와 같은 트림 판정으로 통일했다.
    // 공백이 섞인 `A-PASS`가 오면 레거시 가드는 기능을 껐다 (`deferred.md` D-205).
    nativeSendInitialResidentInfo({
      aptResidentUuid: loginInfo?.uuid ?? '',
      hasAptApassService: hasAptContent({
        contentList: loginInfo?.contentList,
        contentName: APT_CONTENT_NAME.APASS,
      }),
      hasResidentApassService: loginInfo?.apassUseFlag ?? false,
      isDeviceApassActive: loginInfo?.apassOnOffFlag ?? false,
      hasAptLobbyPhoneService: hasLobbyPhone,
      hasResidentLobbyPhoneService: hasLobbyPhone,
    })

    return redirect(ROUTE_PATH.MAIN)
  } catch (error) {
    console.error('[publicRouteLoader] 로그인 정보 조회에 실패해 세션을 정리합니다.', error)
    useAuthStore.getState().clearAuth()

    return redirect(ROUTE_PATH.INTRO)
  }
}
