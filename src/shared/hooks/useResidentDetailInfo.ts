import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { LOGIN_ERROR_CODE } from '@/shared/constants/errorCode'
import { MOVED_OUT_MESSAGE } from '@/shared/constants/message'
import { residentDetailInfoQueryKey } from '@/shared/constants/query'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useChangeApt } from '@/shared/hooks/useChangeApt'
import { useLogoutFlow } from '@/shared/hooks/useLogoutFlow'
import {
  fetchResidentAptList,
  fetchResidentDetailInfo,
  hasAptContent,
  hasWallPadAlarmContent,
} from '@/shared/lib/aptContext'
import { showErrorModal } from '@/shared/lib/errorModal'
import { useAuthStore } from '@/shared/stores/authStore'
import { RESIDENT_STATE } from '@/shared/types/resident'

/**
 * 단지 컨텍스트 조회 + 구독 콘텐츠 게이트. 레거시 `useGetResidentDetailInfo.js` 이식
 * (레거시 사용처 23개 파일).
 *
 * 세 가지를 한다:
 *  1. `GET /apt-resident/{uuid}` 조회
 *  2. 응답을 `aptInfo`(localStorage)에 적재 — 다른 화면들이 동기로 읽는다
 *  3. 구독 서비스별 노출 플래그 계산
 *
 * ⚠️ 레거시 `staleTime: 5000`을 유지한다. 전역 기본값은 0인데 이 쿼리만 5초다 —
 * 한 화면에서 여러 컴포넌트가 동시에 부르므로(마이페이지는 3곳) 그 사이 재요청을 막는다.
 *
 * ⚠️ **메인 화면 스와이퍼 메뉴(`usingSwiperMenu`)는 여기 없다.** 레거시는 같은 훅에
 * 넣어놨지만 메인 전용이라 Main 도메인에서 계산한다 (`features/main`, Phase 6).
 */
export const useResidentDetailInfo = () => {
  const aptResidentUuid = useAuthStore((state) => {
    return state.aptInfo.aptResidentUuid
  })
  const setAptInfo = useAuthStore((state) => {
    return state.setAptInfo
  })
  const navigate = useNavigate()
  const onLogout = useLogoutFlow()
  const onChangeApt = useChangeApt()

  const {
    data: residentDetailInfo,
    isLoading: isResidentDetailInfoLoading,
    error,
  } = useQuery({
    queryKey: residentDetailInfoQueryKey({ aptResidentUuid }),
    queryFn: () => {
      // enabled가 막아주므로 여기서 uuid는 항상 있다.
      return fetchResidentDetailInfo({ aptResidentUuid: aptResidentUuid ?? '' })
    },
    staleTime: 5000,
    enabled: Boolean(aptResidentUuid),
  })

  /**
   * 서버 응답을 localStorage 단지 컨텍스트에 복사한다. 레거시 `watch(..., { immediate: true })`.
   *
   * `useEffect`를 쓰는 이유: **React 밖의 저장소(localStorage)에 쓰는 동기화**이고
   * 렌더 중에 할 수 없다 (`06-react.md`의 허용 사례). 쿼리 데이터 객체는 재조회 전까지
   * 동일 참조라 응답 한 건당 한 번만 실행된다.
   *
   * ⚠️ 서버 데이터를 클라이언트 상태로 복사하는 것은 `04-state.md` 위반이지만,
   * 렌더 밖에서 `aptResidentUuid`를 동기로 읽는 곳이 153군데라 등가 이관을 위해 유지한다
   * (`deferred.md` D-35).
   */
  useEffect(() => {
    if (!residentDetailInfo) return

    setAptInfo({
      communityToken: residentDetailInfo.oldApartmantToken,
      aptId: residentDetailInfo.aptId,
      aptLogoFileUrl: residentDetailInfo.aptLogoFileUrl,
      dong: residentDetailInfo.dong,
      ho: residentDetailInfo.ho,
      residentId: residentDetailInfo.residentId,
      contentList: residentDetailInfo.contentList,
      apassOnOffFlag: residentDetailInfo.apassOnOffFlag,
      apassUseFlag: residentDetailInfo.apassUseFlag,
    })
  }, [residentDetailInfo, setAptInfo])

  /**
   * 세대 전출 처리. 레거시 `watch([error, ...], { once: true })`.
   *
   * `RESIDENT_NOT_FOUND`는 "이 단지에서 전출됐다"는 뜻이다. 남은 단지를 조회해
   *  - 없거나 조회 실패 → 로그아웃
   *  - 승인된 단지가 없음 → 승인 대기 화면으로 로그아웃
   *  - 있음 → 첫 단지로 전환
   *
   * `once` 재현을 위해 ref로 한 번만 실행한다. 이 훅은 한 화면에서 여러 번 호출되므로
   * 가드가 없으면 모달이 여러 개 뜬다.
   */
  const hasHandledErrorRef = useRef(false)

  useEffect(() => {
    if (!error || hasHandledErrorRef.current) return
    hasHandledErrorRef.current = true

    if (error.code !== LOGIN_ERROR_CODE.RESIDENT_NOT_FOUND) {
      void navigate(ROUTE_PATH.ERROR_AUTH, {
        state: { errorCode: error.code, message: error.message },
      })
      return
    }

    const handleMovedOut = async () => {
      // 레거시는 여기서 단지 목록을 refetch한다. 캐시를 거치지 않고 직접 부른다 —
      // 전출 직후의 최신 목록이어야 하고, 이 값을 쓰는 곳이 여기뿐이다.
      let residentAptList: Awaited<ReturnType<typeof fetchResidentAptList>> = []
      let isAptListError = false

      try {
        residentAptList = await fetchResidentAptList()
      } catch (aptListError) {
        isAptListError = true
        console.error('[useResidentDetailInfo] 단지 목록 조회에 실패했습니다.', aptListError)
      }

      showErrorModal({ text: MOVED_OUT_MESSAGE, icon: 'info' })

      if (residentAptList.length <= 0 || isAptListError) {
        onLogout({ path: ROUTE_PATH.HOME })
        return
      }

      const approvedAptList = residentAptList.filter((apt) => {
        return apt.residentState === RESIDENT_STATE.APPROVED
      })

      const [firstApprovedApt] = approvedAptList
      if (!firstApprovedApt) {
        onLogout({ path: ROUTE_PATH.LOGIN_PENDING })
        return
      }

      await onChangeApt({ newAptInfo: firstApprovedApt })
    }

    void handleMovedOut()
  }, [error, navigate, onChangeApt, onLogout])

  const contentList = residentDetailInfo?.contentList

  return {
    residentDetailInfo,
    isResidentDetailInfoLoading,

    // ── 구독 콘텐츠 게이트 ────────────────────────────────────────────────────
    hasAptManagementFeeContent: hasAptContent({
      contentList,
      contentName: APT_CONTENT_NAME.MANAGEMENT_FEE,
    }),
    hasAptParkingContent: hasAptContent({
      contentList,
      contentName: APT_CONTENT_NAME.PARKING,
    }),
    hasAptApassContent: hasAptContent({
      contentList,
      contentName: APT_CONTENT_NAME.APASS,
    }),
    hasAptVisitorPassContent: hasAptContent({
      contentList,
      contentName: APT_CONTENT_NAME.VISITOR_PASS,
    }),
    hasLobbyPhone: hasAptContent({
      contentList,
      contentName: APT_CONTENT_NAME.LOBBY_PHONE,
    }),
    hasFaceRecogContent: hasAptContent({
      contentList,
      contentName: APT_CONTENT_NAME.FACE_RECOG,
    }),
    hasAptBoardCommunityContent: hasAptContent({
      contentList,
      contentName: APT_CONTENT_NAME.BOARD_COMMUNITY,
    }),
    hasAptBoardComplaintsContent: hasAptContent({
      contentList,
      contentName: APT_CONTENT_NAME.BOARD_COMPLAINTS,
    }),
    hasAptAPayQrContent: hasAptContent({
      contentList,
      contentName: APT_CONTENT_NAME.APAY_QR,
    }),
    hasAptAPayPaymentContent: hasAptContent({
      contentList,
      contentName: APT_CONTENT_NAME.APAY_PAYMENT,
    }),
    /** 월패드 알림 UI. 세 가지 연동 중 하나라도 있으면 true */
    hasWallPadAlarmUI: hasWallPadAlarmContent({ contentList }),
  }
}
