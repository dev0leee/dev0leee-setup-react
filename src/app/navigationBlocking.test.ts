import { describe, expect, it } from 'vitest'

import { shouldBlockNavigation } from '@/app/navigationBlocking'
import { ROUTE_PATH } from '@/shared/constants/routes'

describe('shouldBlockNavigation', () => {
  it('오프라인이면 어떤 이동도 막는다', () => {
    expect(
      shouldBlockNavigation({
        historyAction: 'PUSH',
        currentPathname: ROUTE_PATH.MYPAGE_PROFILE,
        isOnline: false,
      }),
    ).toBe(true)
  })

  it('메인·마이페이지·소방점검 완료에서 뒤로가기를 막는다', () => {
    const blockedPaths = [ROUTE_PATH.MAIN, ROUTE_PATH.MYPAGE, ROUTE_PATH.FIRE_INSPECTION_COMPLETE]

    blockedPaths.forEach((currentPathname) => {
      expect(shouldBlockNavigation({ historyAction: 'POP', currentPathname, isOnline: true })).toBe(
        true,
      )
    })
  })

  it('같은 화면에서 뒤로가기가 아닌 이동은 막지 않는다', () => {
    // 마이페이지에서 하위 화면으로 들어가는 것은 PUSH다 — 막으면 앱이 잠긴다.
    expect(
      shouldBlockNavigation({
        historyAction: 'PUSH',
        currentPathname: ROUTE_PATH.MYPAGE,
        isOnline: true,
      }),
    ).toBe(false)
  })

  it('목록에 없는 화면에서는 뒤로가기를 허용한다', () => {
    expect(
      shouldBlockNavigation({
        historyAction: 'POP',
        currentPathname: ROUTE_PATH.MYPAGE_PROFILE,
        isOnline: true,
      }),
    ).toBe(false)
  })
})
