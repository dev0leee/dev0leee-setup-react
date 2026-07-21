import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-sm text-muted-foreground">페이지를 찾을 수 없습니다.</p>
      <Button render={<Link to="/" />}>홈으로</Button>
    </div>
  )
}
