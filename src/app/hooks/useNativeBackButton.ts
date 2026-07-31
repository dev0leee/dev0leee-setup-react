import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useApassLoadingStore } from '@/features/apass'
import { useNativeSubscription } from '@/shared/hooks/useNativeSubscription'
import { nativeExitApp, subscribeToGoBack } from '@/shared/lib/native/common'
import { checkDeviceOs } from '@/shared/lib/native/device'
import { useSurveyCertStore } from '@/shared/stores/surveyCertStore'
import { useVoteCertStore } from '@/shared/stores/voteCertStore'

/**
 * 네이티브 하드웨어 뒤로가기. 레거시 `lib/composables/useNativeBackButton.js`(105 LOC) 이식.
 *
 * ⚠️ **`shared/hooks/`가 아니라 `app/hooks/`에 있다.** 라우트별 분기를 위해
 * apass·vote·survey 슬라이스의 스토어를 읽어야 하는데, `shared`는 `features`를
 * import할 수 없다 (01-folder-structure). 레거시는 공용 composable에서 도메인
 * 스토어 3개를 직접 import하는 층 위반이었다.
 *
 * 분기 순서가 곧 동작 명세다. 위에서 걸리면 아래는 보지 않는다.
 */
export const useNativeBackButton = ({ onRequestExit }: { onRequestExit: () => void }): void => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isApassLoading = useApassLoadingStore((state) => {
    return state.isApassLoading
  })
  const voteCertInfo = useVoteCertStore((state) => {
    return state.voteCertInfo
  })
  const surveyCertInfo = useSurveyCertStore((state) => {
    return state.surveyCertInfo
  })

  const handler = useCallback(() => {
    const { isAndroid, isIOS } = checkDeviceOs()

    // 메인 — 더 갈 곳이 없다. Android는 확인 모달, iOS는 즉시 종료 (OS별 분기)
    if (pathname === '/main' || pathname === '/') {
      if (isAndroid) {
        onRequestExit()
        return
      }
      if (isIOS) nativeExitApp()
      return
    }

    // A-PASS — 토글 진행 중에는 화면을 벗어나지 않는다
    if (pathname === '/apass') {
      if (!isApassLoading) void navigate(-1)
      return
    }

    // 투표·설문 목록 — 히스토리를 거스르지 않고 메인으로 보낸다
    if (pathname === '/vote/list' || pathname === '/survey/list') {
      void navigate('/main')
      return
    }

    // 투표 참여 → 상세. 인증 정보로 경로를 만든다
    if (pathname.includes('/vote/form')) {
      void navigate(`/vote/detail/${voteCertInfo.voteUuid}/${voteCertInfo.voterUuid}`)
      return
    }

    if (pathname.includes('/vote/detail')) {
      void navigate('/vote/list')
      return
    }

    if (pathname.includes('/survey/form')) {
      void navigate(`/survey/detail/${surveyCertInfo.surveyUuid}/${surveyCertInfo.participantUuid}`)
      return
    }

    if (pathname.includes('/survey/detail')) {
      void navigate('/survey/list')
      return
    }

    if (pathname === '/visit/lobbyPhone/faceRegisterManagement') {
      void navigate('/visit/lobbyPhone')
      return
    }

    if (pathname === '/visit/lobbyPhone') {
      void navigate('/visit')
      return
    }

    if (pathname === '/visit') {
      void navigate('/main')
      return
    }

    void navigate(-1)
  }, [isApassLoading, navigate, onRequestExit, pathname, surveyCertInfo, voteCertInfo])

  useNativeSubscription({ subscribe: subscribeToGoBack, handler })
}
