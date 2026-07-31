import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BoardPostList } from '@/features/board/components/BoardPostList'
import { BoardSearchInput } from '@/features/board/components/BoardSearchInput'
import { WriteButton } from '@/features/board/components/WriteButton'
import { BOARD_APP_BAR_TITLE } from '@/features/board/constants/board'
import { useBoardCategoryList, useBoardPostList } from '@/features/board/queries/useBoardPostList'
import { BOARD_TYPE, type BoardType } from '@/features/board/types/post'
import { TabCategory } from '@/shared/components/common/TabCategory'
import { AppBar } from '@/shared/components/layouts/AppBar'

/**
 * 소통공간(B5)·민원공간(B12) 게시판. 레거시는 두 파일이지만 **차이가 라벨과 경로뿐**이라
 * 하나로 합쳤다. 그 밖의 17개 차이(`board.md` §4)는 상세·폼·에러 처리 쪽이고
 * 이 화면에는 나타나지 않는다.
 *
 * ⚠️ **라우트 AppBar를 끄고 화면 안에서 직접 그린다**(`showAppBar: false`).
 * 우측 슬롯에 내 활동 버튼을 넣어야 해서다 — 마이페이지 P2·P3와 같은 패턴.
 *
 * ⚠️ **AppBar 제목이 `민원 공간`(공백 있음)이다.** 폼·내 활동 제목은 `민원공간`으로
 * 붙어 있어 한 도메인에서 표기가 섞인다. 표시 문구라 그대로 옮겼다 (§4 #3).
 *
 * ⚠️ **로딩 중에는 목록이 통째로 안 보인다** — 스피너도 없다 (§B5, B3와 같은 구조).
 */
export const BoardPostListPage = ({ boardType }: { boardType: BoardType }) => {
  const navigate = useNavigate()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0)

  const { categoryList, isCategoryListLoading } = useBoardCategoryList({ boardType })
  const {
    postList,
    isPostListLoading,
    hasPostListNextPage,
    fetchPostListNextPage,
    setAdditionalParams,
  } = useBoardPostList({ boardType })

  const basePath = `/board/${boardType}`

  return (
    <div className="h-full w-full">
      <AppBar title={BOARD_APP_BAR_TITLE[boardType]}>
        <button
          type="button"
          className="h-6 w-6"
          onClick={() => {
            void navigate(`${basePath}/activities`)
          }}
        >
          <img src="/assets/icons/Human.svg" alt="사람 아이콘" />
        </button>
      </AppBar>

      {/* `pt-12`는 화면 안 AppBar(48px) 보정이다. 공지 목록(B1)에는 없다 */}
      <div className="h-[calc(100%-124px)] w-full pt-12">
        <div className="w-full p-5">
          <BoardSearchInput
            onChangeKeyword={(keyword) => {
              setAdditionalParams({ keyword })
              setSearchKeyword(keyword)
            }}
          />
        </div>

        <div className="w-full">
          {!isCategoryListLoading && (
            <TabCategory
              categories={categoryList ?? []}
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

        {!isPostListLoading && (
          <BoardPostList
            list={postList?.pages ?? []}
            boardType={boardType}
            hasNextPage={hasPostListNextPage}
            fetchNextPage={() => {
              void fetchPostListNextPage()
            }}
            searchKeyword={searchKeyword}
          />
        )}
      </div>

      <WriteButton
        onClick={() => {
          void navigate(`${basePath}/write`)
        }}
      />
    </div>
  )
}

/** 라우터가 바로 걸 수 있게 게시판별 화면을 만들어 둔다 */
export const CommunityBoardPage = () => {
  return <BoardPostListPage boardType={BOARD_TYPE.COMMUNITY} />
}

export const ComplaintsBoardPage = () => {
  return <BoardPostListPage boardType={BOARD_TYPE.COMPLAINTS} />
}
