/**
 * 라우트별 레이아웃 설정. 레거시 `route.meta`에 해당한다.
 * react-router의 `handle`에 이 모양으로 담고 `useLayoutConfig`가 읽는다.
 */
export interface RouteLayoutConfig {
  showAppBar: boolean
  showBottomNav: boolean
  appBarTitle: string
  hasBackButton: boolean
  /**
   * 뒤로가기를 히스토리가 아니라 이 경로로 보낸다.
   * 폼을 여러 단계 거쳐 온 화면이 시작점으로 돌아가야 할 때 쓴다.
   */
  backPath: string | null
  /** hex 직접 지정. 레거시에 4곳 있다 (`tech-mapping.md` §10) */
  appBarBackgroundColor: string
}
