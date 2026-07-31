import { useEffect, useRef, useState } from 'react'

import { ApassPermissionItem } from '@/features/apass/components/ApassPermissionItem'
import {
  APASS_LOADING_TIMEOUT_MS,
  APASS_PERMISSION_TYPE,
  APASS_TOGGLE_DEBOUNCE_MS,
  APASS_UPDATE_DEBOUNCE_MS,
} from '@/features/apass/constants/apass'
import { useIsApassActive, usePatchApassActive } from '@/features/apass/queries/useApass'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { nativeSetApassState, subscribeToApassState } from '@/shared/lib/native/apass'
import { nativeGetPermissionInfo, subscribeToPermissionInfo } from '@/shared/lib/native/common'
import { checkDeviceOs } from '@/shared/lib/native/device'
import type { PermissionInfo } from '@/shared/lib/native/schemas'
import { useApassLoadingStore } from '@/shared/stores/apassLoadingStore'

/**
 * A-PASS (AP1). 레거시 `ApassView.vue` + `ApassActivityButton` + `ApassPermissionItem` 이식.
 *
 * **비컨 기반 자동 출입을 켜고 끄는 화면이다.** 하는 일은 둘 — 토글, 그리고 디바이스 권한
 * 4종의 상태 표시. **본질은 네이티브 브릿지 왕복**이다:
 *
 * ```
 * 토글 탭 (300ms 디바운스)
 *   → 로딩 on (로컬 + 전역 — 전역은 뒤로가기를 막는다)
 *   → SET_APASS_STATE                     [Web→App]
 *   → CALLBACK_APASS_STATE                [App→Web]
 *   → 로딩 off → 1초 디바운스 → 앱 상태와 서버 상태가 다르면 PATCH
 *   → 무효화 + GET_PERMISSION_INFO → 헤더·아이콘·문구 갱신
 * ```
 *
 * ✅ **AP-Q3 결정 적용** — 앱이 7초 안에 응답하지 않으면 로컬 로딩만 풀던 것을 고쳐
 * **전역 플래그도 함께 내린다.** 레거시는 그 경로에서 플래그가 `true`로 남아
 * **네이티브 뒤로가기가 영구히 막혔다** (`deferred.md` D-156).
 *
 * ⚠️ **권한 응답 전에는 전부 `허용안됨`으로 보인다.** 로딩 상태와 거부 상태를 구분하지
 * 않는다 — 앱이 아닌 브라우저로 열면 영원히 그렇다 (`apass.md` AP-Q4). 레거시 그대로다.
 *
 * ⚠️ **`apassUseFlag`가 false여도 URL로 직접 들어올 수 있다.** 라우트 가드가 없다 (AP-Q1).
 *
 * ⚠️ 레거시의 죽은 코드 3개는 옮기지 않았다 — 빈 `<div>`, 미사용 `currentX` ref,
 * `content-center`(단일 행 flex에서 무효). **화면 결과가 같다.**
 * `alt="화살표 아이콘"`(토글 이미지)은 복붙 잔재지만 **대체 텍스트라 그대로 뒀다.**
 */
export const ApassPage = () => {
  const { isApassActive } = useIsApassActive()
  const { patchApassActiveMutation } = usePatchApassActive()

  const setIsApassLoading = useApassLoadingStore((state) => {
    return state.setIsApassLoading
  })

  const [isLoading, setIsLoading] = useState(false)
  const [permissionInfo, setPermissionInfo] = useState<PermissionInfo>({})

  const isActive = Boolean(isApassActive?.apassOnOffFlag)

  // 콜백 안에서 최신 서버 상태를 봐야 한다. 구독을 다시 걸지 않으려고 ref로 읽는다
  const isActiveRef = useRef(isActive)
  isActiveRef.current = isActive

  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toggleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopLoading = () => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    setIsLoading(false)
    setIsApassLoading(false)
  }

  const startLoading = () => {
    setIsLoading(true)
    setIsApassLoading(true)

    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    loadingTimerRef.current = setTimeout(() => {
      // ✅ 로컬 로딩과 **전역 플래그를 함께** 내린다 (AP-Q3)
      setIsLoading(false)
      setIsApassLoading(false)
    }, APASS_LOADING_TIMEOUT_MS)
  }

  useEffect(() => {
    // 진입 시 권한 상태를 한 번 물어본다
    nativeGetPermissionInfo()

    // ⚠️ 레거시는 리스너를 해제하지 않아 화면을 드나들 때마다 쌓였고, 핸들러 안의
    // 경로 검사가 그 누수를 가려왔다. cleanup으로 해소되면서 경로 검사도 뺐다
    return subscribeToPermissionInfo<PermissionInfo>({
      handler: (info) => {
        setPermissionInfo(info)
      },
    })
  }, [])

  useEffect(() => {
    return subscribeToApassState({
      handler: (apassState) => {
        stopLoading()

        if (updateTimerRef.current) clearTimeout(updateTimerRef.current)
        updateTimerRef.current = setTimeout(() => {
          // 앱이 알려준 디바이스 상태가 서버와 다를 때만 뒤집는다.
          // 토글 API가 값을 못 받으므로 이 비교가 유일한 방향 제어 수단이다
          if (isActiveRef.current !== apassState.isDeviceApassActive) {
            patchApassActiveMutation()
          }
        }, APASS_UPDATE_DEBOUNCE_MS)
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patchApassActiveMutation])

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
      if (toggleTimerRef.current) clearTimeout(toggleTimerRef.current)
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current)
    }
  }, [])

  const handleToggle = () => {
    if (toggleTimerRef.current) clearTimeout(toggleTimerRef.current)

    toggleTimerRef.current = setTimeout(() => {
      startLoading()
      nativeSetApassState({ isDeviceApassActive: !isActiveRef.current })
    }, APASS_TOGGLE_DEBOUNCE_MS)
  }

  const { isAndroid } = checkDeviceOs()

  const permissionMenus = [
    {
      type: APASS_PERMISSION_TYPE.BLUETOOTH,
      title: `블루투스 접근 권한 ${permissionInfo.btOn ? '허용됨' : '허용안됨'}`,
      isAllowed: Boolean(permissionInfo.btOn),
    },
    {
      type: APASS_PERMISSION_TYPE.GPS,
      title: `GPS 접근 권한 ${permissionInfo.gpsEnabled ? '허용됨' : '허용안됨'}`,
      isAllowed: Boolean(permissionInfo.gpsEnabled),
    },
    {
      // ⚠️ 원문에 공백이 2칸이다. HTML이 하나로 줄여 그리므로 화면 결과는 같다
      type: APASS_PERMISSION_TYPE.LOCATION_ALWAYS_ON,
      title: `위치 항상허용  ${permissionInfo.locAlawaysOn ? '활성화' : '비활성화'}`,
      isAllowed: Boolean(permissionInfo.locAlawaysOn),
    },
    // 송수신 항목은 **Android에만** 있다. iOS는 3개다
    ...(isAndroid
      ? [
          {
            type: APASS_PERMISSION_TYPE.BT_TRANSMIT,
            title: `단말기 A-PASS 송수신 ${permissionInfo.btTransmitt ? '지원' : '미지원'}`,
            isAllowed: Boolean(permissionInfo.btTransmitt),
          },
        ]
      : []),
  ]

  return (
    <div className="h-full w-full overflow-auto">
      <div
        className={`flex h-[276px] w-full flex-col ${
          isActive
            ? 'bg-[linear-gradient(293deg,#2f85df_4.47%,#429eff_119.83%)]'
            : 'bg-defaults-secondary-background-secondary'
        }`}
      >
        {/* 헤더 그라데이션 위에 얹어야 해서 AppBar를 화면이 직접 든다 */}
        <AppBar title="A-PASS" className="bg-transparent" />
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
          <span className={`pretendard-24SemiBold ${isActive ? 'text-white' : ''}`}>
            A-PASS {isActive ? '활성화' : '비활성화'}
          </span>
          {isActive ? (
            <img
              className="absolute -right-2 bottom-0 h-[145.306px] w-[148.313px]"
              src="/assets/icons/ApassEnable.svg"
              alt="수신 활성화 이미지"
            />
          ) : (
            <img
              className="absolute -right-2 bottom-0 h-[101.122px] w-[148.312px]"
              src="/assets/icons/ApassDisable.svg"
              alt="수신 비활성화 이미지"
            />
          )}
        </div>
      </div>

      {/* 토글이 헤더 하단에 26px 걸쳐 뜬다 */}
      <div className="relative h-[26px]">
        <div className="relative bottom-[26px] left-1/2 flex translate-x-[-50%] items-center p-1.5">
          <button className="mt-6" type="button" onClick={handleToggle}>
            <img
              className="absolute top-1/2 left-1/2 h-[124px] w-[124px] translate-x-[-50%] translate-y-[-50%]"
              src={
                isActive ? '/assets/icons/aPass/ApassOn.png' : '/assets/icons/aPass/ApassOff.png'
              }
              alt="화살표 아이콘"
            />
          </button>
        </div>
      </div>

      <div className="my-20 flex flex-col gap-3 px-5">
        {permissionMenus.map((menu) => {
          return (
            <ApassPermissionItem
              key={menu.type}
              type={menu.type}
              title={menu.title}
              isAllowed={menu.isAllowed}
            />
          )
        })}
      </div>

      {isLoading && <SpinnerDots />}
    </div>
  )
}
