import { useNavigate } from 'react-router-dom'

import type { AppBarProps } from '@/shared/types/appBar'
import { cn } from '@/shared/utils/cn'

/**
 * 상단 바. 레거시 `components/layouts/AppBar.vue` 이식.
 *
 * 마크업·클래스를 그대로 옮겼다. 제목은 `absolute left-1/2 -translate-x-1/2`로
 * **화면 기준 정중앙**에 둔다 — flex로 가운데 맞추면 오른쪽 슬롯 폭에 따라 밀린다.
 *
 * `h-12`(48px)이 본문 상단 여백(`pt-12`)의 근거다.
 */
export const AppBar = ({
  title = '',
  hasBackButton = true,
  onBack,
  isFullWidth = true,
  className,
  style,
  children,
}: AppBarProps) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    void navigate(-1)
  }

  return (
    <header
      className={cn(
        'fixed top-0 z-[100] flex h-12 items-center justify-between bg-base-b-white px-5 py-3 text-center whitespace-nowrap text-base-b-black',
        // opinion 앱은 외부 링크로 열리는 화면이라 최대 폭을 제한한다.
        isFullWidth ? 'w-full' : 'w-full max-w-[480px]',
        className,
      )}
      style={style}
    >
      {hasBackButton && (
        <button type="button" className="h-6 w-6" onClick={handleBack}>
          <img src="/assets/icons/ArrowNarrowLeft.svg" alt="뒤로가기 아이콘" className="h-6 w-6" />
        </button>
      )}

      <h1 className="absolute left-1/2 h-fit translate-x-[-50%] text-center pretendard-16Bold">
        {title}
      </h1>

      <div className="flex items-center justify-end gap-2 pretendard-14SemiBold text-base-b-black">
        {children}
      </div>

      {/* 오른쪽 슬롯이 비어 있을 때 제목이 왼쪽으로 쏠리지 않게 자리만 잡는다. */}
      {title && !children && <div className="h-6 w-6 shrink-0 border-none" />}
    </header>
  )
}
