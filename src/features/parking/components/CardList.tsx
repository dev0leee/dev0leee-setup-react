import { type ReactNode, useEffect, useRef } from 'react'

import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { useInfiniteScrollPosition } from '@/shared/hooks/useInfiniteScrollPosition'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'
import { cn } from '@/shared/utils/cn'

/** 로딩 스켈레톤 카드 10개 × 카드당 4행. 레거시 값이다 */
const SKELETON_CARD_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const SKELETON_ROW_INDEXES = [0, 1, 2, 3]

interface CardListProps {
  isLoading: boolean
  isError?: boolean
  /** 에러 1행. 2행(`잠시 후 다시 시도해주세요`)은 여기서 고정으로 붙인다 */
  errorMessage?: string
  /**
   * ⚠️ **이 목록을 렌더하지 않는다.** 로딩/빈 상태 판정과 무한스크롤 가드에만 쓴다.
   * 실제 `<li>`는 부모가 `children`으로 넣는다 — 레거시 슬롯 구조 그대로다.
   */
  list: unknown[] | undefined
  hasNextPage?: boolean
  fetchNextPage?: () => void
  emptyMessage?: string
  /** `false`면 `overflow-auto`가 빠져 바깥 페이지가 스크롤을 가져간다 (PK1 임베드) */
  hasScroll?: boolean
  /** 비어 있지 않을 때만 스크롤 복원이 켜진다. PK8·PK11만 넘긴다 */
  scrollRestorePath?: string
  children: ReactNode
}

/**
 * 주차 도메인 공용 목록 셸. 레거시 `ParkingManagementView/CardList.vue`(124 LOC) 이식.
 * 6개 화면(PK2·PK3·PK4·PK8·PK11·PK15)이 쓴다.
 *
 * ⚠️ **로딩 UX가 게시판과 다르다.** 게시판은 `SpinnerDots` 전체화면인데 주차는
 * 골격 스켈레톤이다. 도메인마다 다른 채로 이관한다 (`parking.md` §2).
 *
 * ⚠️ **로딩 스켈레톤의 `<li>`가 `<div>` 직계 자식이다** (`<ul>`이 없다). HTML 규격
 * 위반이지만 화면은 레거시와 같아야 하므로 그대로 옮겼다.
 *
 * ⚠️ 레거시는 `useInfiniteScrollPosition`을 **조건부로 호출**한다. React 훅은 그럴 수
 * 없어 항상 호출하고 **`scrollRestorePath`가 있을 때만 컨테이너에 ref를 붙인다** —
 * ref가 붙지 않으면 훅의 effect가 바로 빠져나가 저장도 복원도 하지 않는다.
 * 결과가 레거시와 같다 (`parking.md` §3-3).
 */
export const CardList = ({
  isLoading,
  isError = false,
  errorMessage = '데이터를 불러올 수 없습니다',
  list,
  hasNextPage,
  fetchNextPage,
  emptyMessage = '',
  hasScroll = true,
  scrollRestorePath = '',
  children,
}: CardListProps) => {
  const { scrollContainerRef } = useInfiniteScrollPosition<HTMLUListElement>({
    rules: { moveFrom: '/detail', moveTo: scrollRestorePath },
  })

  const { targetRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>()

  /**
   * 레거시는 `watch(targetIsVisible)`이라 **가시성이 바뀔 때만** 발화한다.
   * 다음 페이지를 받으면 목록이 길어져 센티널이 화면 밖으로 나갔다가 다시 들어오고,
   * 그때 한 번 더 발화한다. 의존성에 `hasNextPage`나 목록 길이를 넣으면 센티널이
   * 보이는 동안 응답마다 다시 발화해 **연속 요청이 된다** — ref로 최신 값만 읽는다.
   */
  const hasNextPageRef = useRef(hasNextPage)
  hasNextPageRef.current = hasNextPage
  const listLengthRef = useRef(list?.length ?? 0)
  listLengthRef.current = list?.length ?? 0
  const fetchNextPageRef = useRef(fetchNextPage)
  fetchNextPageRef.current = fetchNextPage

  useEffect(() => {
    if (!isIntersecting) return
    if (!hasNextPageRef.current) return
    // 레거시의 `list?.length > 0` 가드. 빈 목록에서 센티널이 보여도 요청하지 않는다
    if (listLengthRef.current <= 0) return

    fetchNextPageRef.current?.()
  }, [isIntersecting])

  return (
    <div className="h-full w-full bg-defaults-primary-background-primary">
      {isLoading ? (
        <div className="flex h-full w-full flex-col items-start gap-[10px] p-5">
          {SKELETON_CARD_INDEXES.map((cardIndex) => {
            return (
              <li
                key={cardIndex}
                className="w-full space-y-2 rounded-md border border-defaults-tertiary-border-tertiary p-4"
              >
                {SKELETON_ROW_INDEXES.map((rowIndex) => {
                  return (
                    <div key={rowIndex} className="flex w-full items-start justify-between gap-2">
                      <SkeletonBase className="h-4 w-20 rounded" />
                      <SkeletonBase className="h-4 flex-1 rounded" />
                    </div>
                  )
                })}
              </li>
            )
          })}
        </div>
      ) : isError ? (
        <div className="flex h-full items-center justify-center text-center">
          <TextEmpty>
            {errorMessage} <br />
            잠시 후 다시 시도해주세요
          </TextEmpty>
        </div>
      ) : list && list.length > 0 ? (
        <ul
          ref={scrollRestorePath ? scrollContainerRef : undefined}
          className={cn(
            'flex h-full w-full flex-col items-start gap-[10px] p-5',
            hasScroll && 'overflow-auto',
          )}
        >
          {children}
          <div ref={targetRef} className="w-full" />
        </ul>
      ) : (
        <div className="flex h-full items-center justify-center py-20">
          <TextEmpty>{emptyMessage}</TextEmpty>
        </div>
      )}
    </div>
  )
}
