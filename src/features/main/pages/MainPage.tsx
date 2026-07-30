import { useEffect, useRef } from 'react'

import { env } from '@/config/env'
import { AptInfoHeader } from '@/features/main/components/AptInfoHeader'
import { MainCardMenus } from '@/features/main/components/MainCardMenus'
import { BEACON_WORKAROUND_APT_ID } from '@/features/main/constants/main'
import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import { hasAptContent } from '@/shared/lib/aptContext'
import { nativeSendChangedResidentInfo } from '@/shared/lib/native/auth'
import { nativeGetPermissionInfo } from '@/shared/lib/native/common'
import { useAuthStore } from '@/shared/stores/authStore'
import type { ResidentDetailInfo } from '@/shared/types/resident'

/**
 * 특정 단지 전용 우회 코드. 레거시 `MainView.vue`의
 * `watch(residentDetailInfo, ..., { immediate: true, once: true })` 이식.
 *
 * 개발 모드이거나 단지가 고산디에트르에듀파크(`SMA0002`)일 때, 메인 진입 시 입주민
 * 정보를 앱에 **한 번** 다시 보낸다. 앱이 `beacon-list` 하위 `floorNum`만 바뀌면
 * 재요청하지 않는 문제를 우회하려고 만든 임시 코드다 (`main.md` §1 · `deferred.md` D-34).
 *
 * `once` 재현을 위해 ref로 한 번만 실행한다 — `residentDetailInfo`는 재조회마다 참조가
 * 바뀌므로 가드가 없으면 매번 보낸다.
 */
const useBeaconWorkaround = ({
  residentDetailInfo,
}: {
  residentDetailInfo: ResidentDetailInfo | undefined
}) => {
  const hasSentRef = useRef(false)

  useEffect(() => {
    if (!residentDetailInfo || hasSentRef.current) return

    const { aptId, aptResidentUuid } = useAuthStore.getState().aptInfo
    const isTargetApt = env.APP_ENV === 'development' || aptId === BEACON_WORKAROUND_APT_ID
    if (!isTargetApt) return

    hasSentRef.current = true

    const hasLobbyPhone = hasAptContent({
      contentList: residentDetailInfo.contentList,
      contentName: APT_CONTENT_NAME.LOBBY_PHONE,
    })

    nativeSendChangedResidentInfo({
      aptResidentUuid: aptResidentUuid ?? '',
      hasAptApassService: hasAptContent({
        contentList: residentDetailInfo.contentList,
        contentName: APT_CONTENT_NAME.APASS,
      }),
      hasResidentApassService: residentDetailInfo.apassUseFlag ?? false,
      isDeviceApassActive: residentDetailInfo.apassOnOffFlag ?? false,
      hasAptLobbyPhoneService: hasLobbyPhone,
      hasResidentLobbyPhoneService: hasLobbyPhone,
    })
  }, [residentDetailInfo])
}

/**
 * 메인 화면. 레거시 `MainView/MainView.vue` 이식 (`main.md` M1).
 *
 * ⚠️ **아직 헤더·카드까지만 이관됐다.** 메뉴 스와이퍼·광고 배너·공지 Top3·쇼핑 마케팅
 * 동의는 이어지는 단계에서 붙인다 (`progress.md`).
 * 공지 팝업(Board)·투표 대기 팝업(Vote)은 **그 도메인이 이관돼야** 붙일 수 있다.
 *
 * ⚠️ **마운트 시 앱에 권한 정보를 요청한다.** 응답(`CALLBACK_PERMISSION_INFO`)은
 * A-PASS 배지가 구독한다. 레거시는 이 화면도 응답을 구독해 `pushAuthorized`에 담았지만
 * **그 값을 어디에도 쓰지 않는다** — 저장만 하는 죽은 상태라 옮기지 않았다
 * (`main.md` M-Q5 · `deferred.md` D-33). 요청 호출은 실제 부수효과라 유지한다.
 */
export const MainPage = () => {
  const { residentDetailInfo } = useResidentDetailInfo()

  // 앱에 권한 정보를 요청한다. 배지도 자기 마운트에서 한 번 더 부른다(레거시 동일).
  useEffect(() => {
    nativeGetPermissionInfo()
  }, [])

  useBeaconWorkaround({ residentDetailInfo })

  return (
    <div className="h-full w-full">
      <div className="h-full w-full space-y-5 overflow-auto bg-defaults-secondary-background-secondary px-5 py-6">
        <AptInfoHeader />
        <MainCardMenus />
      </div>
    </div>
  )
}
