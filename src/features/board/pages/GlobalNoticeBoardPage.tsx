import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BoardSearchInput } from '@/features/board/components/BoardSearchInput'
import { GlobalNoticeBoardItem } from '@/features/board/components/GlobalNoticeBoardItem'
import { BOARD_EMPTY_TEXT } from '@/features/board/constants/board'
import { useGlobalNoticeList } from '@/features/board/queries/useGlobalNoticeList'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { globalNoticeDetailPath, ROUTE_PATH } from '@/shared/constants/routes'
import { useInfiniteScrollPosition } from '@/shared/hooks/useInfiniteScrollPosition'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'

/**
 * 아파트먼트 공지사항 목록 (B3). 레거시 `GlobalNoticeBoardView.vue` +
 * `GlobalNoticePostList.vue` 두 파일을 합쳤다 — 부모가 목록에 props를 그대로 흘려보내기만
 * 해서 나눌 이유가 없다(`10-components.md` props drilling).
 *
 * **B1과 달리 카테고리 탭이 없고** 스크롤 복원은 공용 `useInfiniteScrollPosition`을 쓴다.
 */
export const GlobalNoticeBoardPage = () => {
  const navigate = useNavigate()
  const [searchKeyword, setSearchKeyword] = useState('')

  const {
    globalNoticeList,
    isGlobalNoticeListLoading,
    hasGlobalNoticeListNextPage,
    fetchGlobalNoticeListNextPage,
    setAdditionalParams,
  } = useGlobalNoticeList()

  const { targetRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>()
  const { scrollContainerRef } = useInfiniteScrollPosition<HTMLUListElement>({
    rules: { moveFrom: '/detail', moveTo: ROUTE_PATH.BOARD_GLOBAL_NOTICE },
  })

  useEffect(() => {
    if (!hasGlobalNoticeListNextPage || !isIntersecting) return

    void fetchGlobalNoticeListNextPage()
  }, [hasGlobalNoticeListNextPage, isIntersecting, fetchGlobalNoticeListNextPage])

  const notices = globalNoticeList?.pages ?? []

  return (
    <div className="h-full w-full pb-16">
      <div className="p-5">
        <BoardSearchInput
          onChangeKeyword={(keyword) => {
            setAdditionalParams({ keyword })
            setSearchKeyword(keyword)
          }}
        />
      </div>

      {/*
       * ⚠️ **로딩 중에는 아무것도 보이지 않는다.** 레거시는 목록 컴포넌트를 통째로
       * `v-if="!isLoading"`으로 감싸는데, 스피너는 **그 컴포넌트 안**에 있다.
       * 즉 스피너가 렌더될 수 있는 조건이 없다 — 검색창만 있는 빈 화면이 잠깐 보인다.
       * 스피너를 밖으로 꺼내면 없던 로딩 표시가 생기므로 그대로 둔다.
       */}
      {!isGlobalNoticeListLoading && (
        <div className="h-full w-full">
          {notices.length > 0 ? (
            <ul
              ref={scrollContainerRef}
              className="h-full w-full items-start space-y-2.5 overflow-auto px-5 pb-5"
            >
              {notices.map((notice) => {
                return (
                  <GlobalNoticeBoardItem
                    key={notice.uuid}
                    boardInfo={notice}
                    searchKeyword={searchKeyword}
                    onSelect={(uuid) => {
                      void navigate(globalNoticeDetailPath({ uuid }))
                    }}
                  />
                )
              })}
              <div ref={targetRef} className="w-full pt-4" />
            </ul>
          ) : (
            <div className="flex h-full items-center justify-center">
              <TextEmpty>{BOARD_EMPTY_TEXT.GLOBAL_NOTICE}</TextEmpty>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
