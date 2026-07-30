import { useEffect, useState } from 'react'

import { ChipBase } from '@/shared/components/common/ChipBase'
import { useNativeSubscription } from '@/shared/hooks/useNativeSubscription'
import { nativeGetPermissionInfo, subscribeToPermissionInfo } from '@/shared/lib/native/common'
import type { PermissionInfo } from '@/shared/lib/native/schemas'

/**
 * A-PASS 상태 배지. 레거시 `MainCardApassBadge.vue` 이식.
 *
 * **4단계로 갈린다.** 위에서부터 먼저 맞는 것을 쓴다:
 *
 * | 조건                                   | 표시     |
 * | -------------------------------------- | -------- |
 * | 서비스 미가입                          | `미가입` |
 * | 가입했지만 기기에서 끔                 | `미사용` |
 * | 켰고 **블루투스·GPS 둘 다 허용**       | `사용중` |
 * | 켰지만 권한이 없음                     | `권한없음` |
 *
 * ⚠️ **`사용중`만 `ChipBase`가 아니라 자체 마크업이다.** 초록 점 SVG + 연한 초록 배경으로
 * 칩 체계에 없는 모양이라 레거시가 직접 그렸다. 그대로 옮겼다.
 *
 * ⚠️ **이 컴포넌트도 마운트 시 권한 정보를 요청하고 응답을 따로 구독한다.**
 * `MainPage`가 이미 같은 일을 하므로 요청이 2번 나간다 — 레거시 그대로다
 * (`main.md` 주의 10). 구독이 여기 있는 이유는 응답을 쓰는 곳이 여기뿐이기 때문이다.
 */
export const MainCardApassBadge = ({
  apassStatus,
  apassUseFlagStatus,
}: {
  apassStatus?: boolean
  apassUseFlagStatus?: boolean
}) => {
  const [permissionInfo, setPermissionInfo] = useState<PermissionInfo>()

  useEffect(() => {
    nativeGetPermissionInfo()
  }, [])

  useNativeSubscription<PermissionInfo>({
    subscribe: subscribeToPermissionInfo,
    handler: setPermissionInfo,
  })

  if (!apassUseFlagStatus) {
    return (
      <div className="whitespace-nowrap">
        <ChipBase color="gray" variant="fill">
          미가입
        </ChipBase>
      </div>
    )
  }

  if (!apassStatus) {
    return (
      <div className="whitespace-nowrap">
        <ChipBase color="gray" variant="fill">
          미사용
        </ChipBase>
      </div>
    )
  }

  if (permissionInfo?.btOn && permissionInfo.gpsEnabled) {
    return (
      <div className="whitespace-nowrap">
        <div className="flex h-5 w-fit items-center gap-[2px] rounded-[31px] bg-[rgba(0,187,64,0.1)] px-1.5 py-[3px] pretendard-12SemiBold text-base-b-black">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="5"
            height="6"
            viewBox="0 0 5 6"
            fill="none"
          >
            <circle cx="2.54663" cy="3" r="2.04663" fill="#00BB40" />
          </svg>
          <span>사용중</span>
        </div>
      </div>
    )
  }

  return (
    <div className="whitespace-nowrap">
      <ChipBase color="orange" variant="fill">
        권한없음
      </ChipBase>
    </div>
  )
}
