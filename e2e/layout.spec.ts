import { expect, test } from '@playwright/test'

import { mockAptApis, seedSession } from './support/session'

/**
 * 레이아웃 높이 체인 검증.
 *
 * **jsdom은 레이아웃을 계산하지 않아 단위 테스트로는 절대 잡히지 않는 종류다.**
 * Phase 5에서 실제로 놓쳤다 — `PageTransition`이 높이 없는 `div`를 끼워넣어
 * 화면의 `h-full`이 `auto`로 무너지고, `main`의 `overflow-hidden`이 내용을 잘라
 * **마이페이지 스크롤이 안 됐다.**
 *
 * 레거시는 Vue `<Transition>`이 DOM 노드를 만들지 않아 화면이 `<main>`의 직계
 * 자식이었다(`LayoutAuth.vue`). React는 애니메이션을 걸 박스가 필요해 래퍼가 생긴다.
 *
 * 이 파일은 **화면 내용이 아니라 높이 계약**을 본다. 새 화면을 만들 때 라우트만
 * 추가하면 같은 회귀를 막을 수 있다.
 */

/** 레거시 기준 뷰포트. 내용이 반드시 넘치도록 낮게 잡는다 */
const MOBILE_VIEWPORT = { width: 392, height: 600 }

/** `AppBar` 48px · `BottomNavigation` 67px · 마이페이지 제목 52px */
const MYPAGE_TITLE_HEIGHT = 52

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(MOBILE_VIEWPORT)
  await seedSession({ page })
  await mockAptApis({ page })
})

test('마이페이지 스크롤 영역이 실제로 스크롤된다', async ({ page }) => {
  await page.goto('/mypage')
  await expect(page.getByRole('heading', { name: '마이페이지' })).toBeVisible()
  // 메뉴가 다 그려진 뒤에 재야 한다 — 내용이 짧으면 넘치지 않는다
  await expect(page.getByText('주차관리')).toBeVisible()

  const scroller = page.locator('main div.overflow-auto').first()

  const { clientHeight, scrollHeight } = await scroller.evaluate((el) => {
    return { clientHeight: el.clientHeight, scrollHeight: el.scrollHeight }
  })

  // 높이가 0이면 h-full 체인이 끊긴 것이다 (버그가 있던 상태)
  expect(clientHeight).toBeGreaterThan(0)
  // 내용이 넘쳐야 스크롤이 의미가 있다
  expect(scrollHeight).toBeGreaterThan(clientHeight)

  await scroller.evaluate((el) => {
    el.scrollTop = 200
  })
  expect(
    await scroller.evaluate((el) => {
      return el.scrollTop
    }),
  ).toBe(200)
})

test('스크롤 영역 높이가 본문에서 제목 높이만큼만 줄어든다', async ({ page }) => {
  await page.goto('/mypage')
  await expect(page.getByText('주차관리')).toBeVisible()

  const mainHeight = await page.locator('main').evaluate((el) => {
    return el.clientHeight
  })
  const scrollerHeight = await page
    .locator('main div.overflow-auto')
    .first()
    .evaluate((el) => {
      return el.clientHeight
    })

  // 레거시 `h-[calc(100%-52px)]`가 그대로 성립하는지 본다.
  // 래퍼가 높이를 먹으면 이 차이가 52px보다 커진다.
  expect(mainHeight - scrollerHeight).toBe(MYPAGE_TITLE_HEIGHT)
})

test('하단 탭이 있는 화면의 본문 높이가 화면에서 67px 줄어든다', async ({ page }) => {
  await page.goto('/mypage')
  await expect(page.getByRole('heading', { name: '마이페이지' })).toBeVisible()

  const mainHeight = await page.locator('main').evaluate((el) => {
    return el.clientHeight
  })

  expect(MOBILE_VIEWPORT.height - mainHeight).toBe(67)
})

test('AppBar가 있는 화면은 본문이 48px 밀려 시작한다', async ({ page }) => {
  await page.goto('/mypage/alarmSetting')
  await expect(page.getByRole('heading', { name: '알림 설정' })).toBeVisible()

  const paddingTop = await page.locator('main').evaluate((el) => {
    return getComputedStyle(el).paddingTop
  })

  expect(paddingTop).toBe('48px')
})

test('관리사무소 화면도 스크롤 컨테이너 높이가 살아 있다', async ({ page }) => {
  // 이 화면은 루트가 직접 `h-full overflow-auto`다 — 래퍼가 죽으면 같이 무너진다
  await page.goto('/mypage/aptInfo')
  await expect(page.getByRole('heading', { name: '연락처' })).toBeVisible()

  const height = await page
    .locator('main > div > div.overflow-auto')
    .first()
    .evaluate((el) => {
      return el.clientHeight
    })

  // AppBar 48px을 뺀 나머지를 다 쓴다
  expect(height).toBe(MOBILE_VIEWPORT.height - 48)
})
