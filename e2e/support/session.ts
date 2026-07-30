import type { Page } from '@playwright/test'

/**
 * e2e에서 로그인 상태와 서버 응답을 만든다.
 *
 * 로그인 폼을 매번 통과하지 않는 이유: 이 파일을 쓰는 테스트들이 검증하려는 것은
 * **로그인 이후의 화면**이다.
 *
 * ⚠️ **localStorage 키·직렬화 방식이 앱과 같아야 한다** (`shared/constants/storage.ts`).
 * 토큰은 raw 문자열, `aptInfo`는 JSON이다 — 레거시 호환을 위한 비대칭이다.
 */

/** 라우터 가드(`hasStoredSession`)가 요구하는 최소 단지 컨텍스트 */
export const APT_INFO = {
  aptResidentUuid: 'resident-uuid-1',
  aptUuid: 'apt-uuid-1',
  aptName: '아파트먼트 1단지',
  residentName: '홍길동',
  residentNickName: '길동',
}

/** 마이페이지 메뉴 그룹이 모두 나오도록 전 서비스를 구독한 단지 */
const CONTENT_LIST = [
  { name: '주차' },
  { name: 'A-PASS' },
  { name: '소통' },
  { name: '민원' },
  { name: '로비폰' },
]

const RESIDENT_DETAIL_INFO = {
  aptId: 'APT-1',
  aptName: APT_INFO.aptName,
  aptLogoFileUrl: '',
  residentId: 'resident-1',
  dong: '101',
  ho: '1001',
  contentList: CONTENT_LIST,
  apassUseFlag: true,
  apassOnOffFlag: false,
}

const NOTIFICATION_SETTING = {
  regularPushFlag: true,
  externalPushFlag: false,
  wallPadParkingNotificationFlag: false,
  marketingDataConsentFlag: true,
  receiveAdvertsConsentFlag: false,
  marketingDataConsentLastModifiedDateTime: '2026-07-30T10:00:00.000000',
  receiveAdvertsConsentLastModifiedDateTime: '2026-07-30T10:00:00.000000',
}

/**
 * 세션을 심는다. `addInitScript`라서 **첫 스크립트가 돌기 전에** 적용된다 —
 * `page.goto` 후에 넣으면 가드가 이미 판단을 끝내 인트로로 튕긴다.
 */
export const seedSession = async ({ page }: { page: Page }): Promise<void> => {
  await page.addInitScript(
    ({ aptInfo }) => {
      localStorage.setItem('accessToken', 'e2e-access-token')
      localStorage.setItem('refreshToken', 'e2e-refresh-token')
      localStorage.setItem('aptInfo', JSON.stringify(aptInfo))
    },
    { aptInfo: APT_INFO },
  )
}

/**
 * 앱이 부르는 서버 응답을 전부 대신한다.
 *
 * ⚠️ **경로 하나하나를 `page.route`로 걸지 않고 술어 함수로 API 전체를 가로챈다.**
 *  - `VITE_API_URL`은 각자의 `.env.development`에 있어 호스트를 하드코딩할 수 없다
 *  - 패턴을 여러 개 걸면 **등록 순서가 우선순위**가 되어(나중 등록이 이김) 조용히 어긋난다
 *  - **빠뜨린 엔드포인트가 실제 백엔드로 새어 나가면** 병렬 실행에서 타임아웃으로 나타난다.
 *    실제로 그렇게 실패했다 — 단독 실행은 통과하고 병렬만 깨져서 진단이 늦었다
 *
 * 모르는 경로는 `500`으로 즉시 끊는다. 조용히 통과시키면 다음 사람이 같은 함정에 빠진다.
 */
export const mockAptApis = async ({ page }: { page: Page }): Promise<void> => {
  await page.route(
    (url) => {
      return url.pathname.includes('/apartmant/resident')
    },
    (route) => {
      const { pathname } = new URL(route.request().url())

      if (pathname.endsWith('/notification-setting')) {
        return route.fulfill({ json: { success: NOTIFICATION_SETTING } })
      }
      if (pathname.includes('/lobby-phone/push')) {
        return route.fulfill({ json: { success: { lobbyPhonePushFlag: true } } })
      }
      if (pathname.endsWith('/apt-resident/apt')) {
        return route.fulfill({
          json: {
            success: [{ aptResidentUuid: APT_INFO.aptResidentUuid, aptUuid: APT_INFO.aptUuid }],
          },
        })
      }
      if (pathname.includes('/apt-resident/')) {
        return route.fulfill({ json: { success: RESIDENT_DETAIL_INFO } })
      }
      if (pathname.includes('/department/')) {
        return route.fulfill({ json: { success: [{ name: '관리사무소', phone: '0212345678' }] } })
      }
      if (pathname.includes('/office/')) {
        return route.fulfill({
          json: {
            success: [
              { uuid: 'h1', dayType: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00' },
            ],
          },
        })
      }

      return route.fulfill({
        status: 500,
        json: { error: { errorCode: 'E2E_UNMOCKED', message: `mock 없는 경로: ${pathname}` } },
      })
    },
  )
}
