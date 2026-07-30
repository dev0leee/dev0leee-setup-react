import { cn } from '@/shared/utils/cn'

/**
 * 로딩 스켈레톤. 레거시 `SkeletonBase.vue`.
 *
 * 크기는 호출부가 `className`으로 정한다 — 레거시도 색만 prop이고 나머지는
 * 부모가 클래스로 줬다. shadcn `skeleton`을 쓰지 않은 이유는 색·둥근모서리
 * 기본값이 달라서다(`bg-[#CDCBCBFF]` 고정).
 */
export const SkeletonBase = ({
  color = 'bg-[#CDCBCBFF]',
  className,
}: {
  color?: string
  className?: string
}) => {
  return <div className={cn('animate-pulse', color, className)} />
}
