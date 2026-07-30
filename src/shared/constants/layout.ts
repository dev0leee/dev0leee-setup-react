import type { RouteLayoutConfig } from '@/shared/types/layout'

/**
 * 라우트가 아무것도 지정하지 않았을 때의 레이아웃.
 * 레거시 `useLayoutConfig.js`의 `DEFAULT_LAYOUT` 그대로다 —
 * **AppBar와 뒤로가기 버튼은 기본이 켜짐**이다.
 */
export const DEFAULT_ROUTE_LAYOUT: RouteLayoutConfig = {
  showAppBar: true,
  showBottomNav: false,
  appBarTitle: '',
  hasBackButton: true,
  backPath: null,
  appBarBackgroundColor: '#ffffff',
}

/** AppBar 높이(px). 본문 상단 여백 `pt-12`의 근거다 */
export const APP_BAR_HEIGHT = 48

/** BottomNavigation 높이(px). 본문 높이 `calc(100% - 67px)`의 근거다 */
export const BOTTOM_NAV_HEIGHT = 67

/** 앱 종료 확인 모달. 레거시 `constants/domain/common.js` 그대로 */
export const APP_EXIT_MODAL_DATA = {
  description: '앱을 종료하시겠습니까?',
  firstButton: '취소',
  secondButton: '확인',
} as const
