import { LogOut } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'

import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { RouteErrorFallback } from '@/components/errors/fallbacks'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/store'
import { useLogout } from '@/features/auth/useLogout'

export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh">
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <span className="font-semibold">dev0leee</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.name}</span>
          <Button size="sm" variant="ghost" onClick={() => void logout()}>
            <LogOut /> 로그아웃
          </Button>
        </div>
      </header>

      {/* 2계층 바운더리 - 페이지가 죽어도 위 헤더는 살아남는다.
          resetKeys에 pathname을 넣어 라우트 이동 시 자동 복구되게 한다. */}
      <main>
        <QueryErrorBoundary FallbackComponent={RouteErrorFallback} resetKeys={[pathname]}>
          <Outlet />
        </QueryErrorBoundary>
      </main>
    </div>
  )
}
