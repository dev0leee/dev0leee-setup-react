/**
 * 하단 탭 항목. 레거시 `BottomNavigation.vue`의 `navList` 그대로.
 *
 * ⚠️ 레거시에 **주석 처리된 항목 2개**(게시판·알림)가 있다. 되살리지 않는다 —
 * 탭이 늘면 화면이 달라진다. 복구 계획이 있으면 별도 작업이다.
 *
 * `iconName`은 `/assets/icons/bottomNav/{iconName}.svg`와
 * `{iconName}Active.svg` 두 파일에 대응한다.
 */
export const BOTTOM_NAV_ITEMS = [
  { menuName: '우리아파트', path: '/main', iconName: 'Home' },
  { menuName: '마이페이지', path: '/mypage', iconName: 'User' },
] as const
