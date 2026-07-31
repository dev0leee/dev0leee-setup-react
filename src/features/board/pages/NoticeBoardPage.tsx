import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BoardSearchInput } from '@/features/board/components/BoardSearchInput'
import { NoticeBoardItem } from '@/features/board/components/NoticeBoardItem'
import { BOARD_EMPTY_TEXT, NOTICE_SCROLL_STORAGE_KEY } from '@/features/board/constants/board'
import { useNoticeCategoryList } from '@/features/board/queries/useNoticeDetail'
import { useNoticeList } from '@/features/board/queries/useNoticeList'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { TabCategory } from '@/shared/components/common/TabCategory'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { boardNoticeDetailPath } from '@/shared/constants/routes'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'

/**
 * 공지사항 목록 (B1). 레거시 `NoticeBoard/NoticeBoardView.vue` 이식.
 *
 * ⚠️ **스크롤 위치 복원을 자체 구현한다.** 다른 목록은 `useInfiniteScrollPosition`
 * (공용 키 `scrollRestoration`)을 쓰는데 B1만 전용 키와 다른 타이밍을 쓴다.
 * 통합하지 않는다 — 동작이 실제로 다르다 (`board.md` §B1).
 *
 * ⚠️ **레이아웃이 어긋난 채로 배포돼 있다.** 루트가 `h-[calc(100%-124px)]`인데 그 안의
 * 스크롤 컨테이너가 다시 `h-full`이라, 검색·탭 영역 높이만큼 화면 밖으로 넘친다.
 * 124px의 근거도 코드에 없다. 그대로 옮긴다.
 */
export const NoticeBoardPage = () => {
  const navigate = useNavigate()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0)

  const { noticeCategoryList, isNoticeCategoryListLoading } = useNoticeCategoryList()
  const {
    noticeList,
    isNoticeListLoading,
    hasNoticeListNextPage,
    fetchNoticeListNextPage,
    setAdditionalParams,
  } = useNoticeList()

  const { targetRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasNoticeListNextPage || !isIntersecting) return

    void fetchNoticeListNextPage()
  }, [hasNoticeListNextPage, isIntersecting, fetchNoticeListNextPage])

  /**
   * 레거시 `onUpdated`. **매 렌더 후** 저장된 위치로 되돌린다 — 마운트 1회가 아니다.
   * 그래서 무한스크롤로 다음 장이 붙을 때마다 저장 위치로 튄다. deps 없는 `useEffect`가
   * 정확히 대응한다 (`board.md` §B1 · `deferred.md` 「동작 의심」).
   */
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const savedScrollTop = sessionStorage.getItem(NOTICE_SCROLL_STORAGE_KEY)
    if (savedScrollTop === null) return

    container.scrollTop = parseInt(savedScrollTop, 10)
  })

  /**
   * 레거시 `onBeforeRouteLeave`. **상세로 나가면 위치를 남기고, 그 외 경로면 지운다.**
   *
   * 레거시는 목적지 라우트의 `meta.fromNotice`로 판단한다 — 그 메타는 B2에만 있다.
   * React Router에는 "어디로 나가는지"를 언마운트 시점에 알려주는 수단이 없으므로,
   * **상세로 보내는 유일한 경로인 아이템 클릭에 표시를 남겨** 같은 판정을 만든다.
   * `window.location`을 읽는 방법도 있지만 라우터 구현에 묶이고 테스트에서 깨진다.
   */
  const isLeavingToDetailRef = useRef(false)

  useEffect(() => {
    return () => {
      if (isLeavingToDetailRef.current) return

      sessionStorage.removeItem(NOTICE_SCROLL_STORAGE_KEY)
    }
  }, [])

  const moveToDetail = (uuid: string) => {
    // 이동 직전에 현재 위치를 저장한다 (언마운트가 아니라 클릭 시점이다)
    sessionStorage.setItem(
      NOTICE_SCROLL_STORAGE_KEY,
      String(scrollContainerRef.current?.scrollTop ?? 0),
    )
    isLeavingToDetailRef.current = true
    void navigate(boardNoticeDetailPath({ uuid }))
  }

  const notices = noticeList?.pages ?? []
  const totalElements = noticeList?.pageable.totalElements

  return (
    <div className="h-[calc(100%-124px)] w-full">
      <div className="flex w-full flex-col gap-6 p-5">
        <BoardSearchInput
          onChangeKeyword={(keyword) => {
            setAdditionalParams({ keyword })
            setSearchKeyword(keyword)
          }}
        />
      </div>

      <div className="w-full">
        {!isNoticeCategoryListLoading && (
          <TabCategory
            categories={noticeCategoryList ?? []}
            selectedIndex={selectedCategoryIndex}
            hasTotalType
            className="pb-6"
            onSelect={({ index, category }) => {
              setSelectedCategoryIndex(index)
              setAdditionalParams({ categoryUuid: category.uuid })
            }}
          />
        )}
      </div>

      <div ref={scrollContainerRef} className="h-full w-full overflow-auto">
        {isNoticeListLoading && <SpinnerDots />}

        {notices.length > 0 ? (
          <ul className="flex w-full flex-col items-start">
            {notices.map((notice, index) => {
              return (
                <NoticeBoardItem
                  key={notice.uuid}
                  boardInfo={notice}
                  searchKeyword={searchKeyword}
                  // 마지막 항목에만 구분선이 없다. 판정 기준이 **총 개수**라
                  // 무한스크롤 중간에는 어떤 항목에도 걸리지 않는다(레거시 동일).
                  className={
                    totalElements !== undefined && totalElements - 1 === index
                      ? ''
                      : 'border-b border-defaults-tertiary-border-tertiary'
                  }
                  onSelect={moveToDetail}
                />
              )
            })}
            <div ref={targetRef} className="w-full pt-4" />
          </ul>
        ) : (
          <div className="flex h-full items-center justify-center">
            <TextEmpty>{BOARD_EMPTY_TEXT.NOTICE}</TextEmpty>
          </div>
        )}
      </div>
    </div>
  )
}
