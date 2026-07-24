import { ChevronLeft } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

interface AppBarProps {
  title: string
  hasBackButton?: boolean
  onBack?: () => void
  className?: string
}

export function AppBar({ title, hasBackButton = false, onBack, className }: AppBarProps) {
  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-10 flex h-12 items-center gap-1 border-b border-border bg-background px-2',
        className,
      )}
    >
      {hasBackButton ? (
        <Button aria-label="뒤로 가기" size="icon" variant="ghost" onClick={onBack}>
          <ChevronLeft />
        </Button>
      ) : null}

      <h1 className="flex-1 truncate text-center text-sm font-semibold">{title}</h1>

      {/* 뒤로가기 버튼과 같은 폭을 반대편에 둬야 제목이 진짜 가운데 온다. */}
      {hasBackButton ? <span aria-hidden className="size-8 shrink-0" /> : null}
    </header>
  )
}
