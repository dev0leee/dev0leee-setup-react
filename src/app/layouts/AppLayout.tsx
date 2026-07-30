import { Outlet, useLocation } from 'react-router-dom'

import { useLayoutConfig } from '@/app/hooks/useLayoutConfig'
import { RouteErrorFallback } from '@/shared/components/errors/fallbacks'
import { QueryErrorBoundary } from '@/shared/components/errors/QueryErrorBoundary'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { BottomNavigation } from '@/shared/components/layouts/BottomNavigation'
import { PageTransition } from '@/shared/components/layouts/PageTransition'
import { DEFAULT_ROUTE_LAYOUT } from '@/shared/constants/layout'
import { cn } from '@/shared/utils/cn'

/**
 * 화면 레이아웃. 레거시 `LayoutPublic.vue` + `LayoutAuth.vue`를 하나로 합쳤다.
 *
 * 두 파일의 차이는 `BottomNavigation` 렌더 여부뿐이고, 그 조건이 이미
 * `layoutConfig.showBottomNav`로 표현된다. 공개 라우트는 이 값을 켜지 않으므로
 * 하나로 합쳐도 동작이 같다.
 *
 * 높이 계산이 레거시 그대로다:
 *  - 하단 탭이 있으면 `h-[calc(100%-67px)]`, 없으면 `h-full`
 *  - AppBar가 있으면 `pt-12`(48px)
 */
export const AppLayout = () => {
  const { layoutConfig, appBarOnBack } = useLayoutConfig()
  const { pathname } = useLocation()

  return (
    <>
      {layoutConfig.showAppBar && (
        <AppBar
          title={layoutConfig.appBarTitle}
          hasBackButton={layoutConfig.hasBackButton}
          onBack={appBarOnBack}
          // 흰색이면 클래스가 이미 흰색이라 인라인 스타일을 붙이지 않는다(레거시 동일).
          style={
            layoutConfig.appBarBackgroundColor === DEFAULT_ROUTE_LAYOUT.appBarBackgroundColor
              ? undefined
              : { backgroundColor: layoutConfig.appBarBackgroundColor }
          }
        />
      )}

      <main
        className={cn(
          'overflow-hidden',
          layoutConfig.showBottomNav ? 'h-[calc(100%-67px)]' : 'h-full',
          layoutConfig.showAppBar && 'pt-12',
        )}
      >
        {/* 2계층 바운더리 — 페이지가 죽어도 AppBar·하단 탭은 살아남는다.
            resetKeys에 pathname을 넣어 라우트 이동 시 자동 복구된다. */}
        <QueryErrorBoundary FallbackComponent={RouteErrorFallback} resetKeys={[pathname]}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </QueryErrorBoundary>
      </main>

      {layoutConfig.showBottomNav && <BottomNavigation />}
    </>
  )
}
