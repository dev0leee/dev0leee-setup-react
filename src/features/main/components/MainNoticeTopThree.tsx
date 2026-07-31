import { useNavigate } from 'react-router-dom'

import { useNoticeTopThree } from '@/features/main/queries/useNoticeTopThree'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { TextEmpty } from '@/shared/components/common/TextEmpty'
import { boardNoticeDetailPath, ROUTE_PATH } from '@/shared/constants/routes'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

const SKELETON_ROW_COUNT = 3

/**
 * 공지 Top3. 레거시 `MainNoticeTopThree.vue` 이식.
 *
 * ⚠️ **`<li className="contents">`가 레이아웃의 핵심이다.** li 자신을 레이아웃에서
 * 빼고 자식(카테고리·제목)을 부모 grid의 셀로 올린다. 그래야 공지 3건의 카테고리 열이
 * 서로 정렬된다. `contents`를 빼면 각 li가 한 셀을 차지해 2열 정렬이 깨진다.
 *
 * ⚠️ 카테고리와 제목이 **각각 별도 버튼**이다. 둘 다 같은 상세로 간다.
 */
export const MainNoticeTopThree = () => {
  const navigate = useNavigate()
  const { noticeTopThree, isNoticeTopThreeLoading, isNoticeTopThreeError } = useNoticeTopThree()

  const hasNotice = noticeTopThree !== undefined && noticeTopThree.length > 0

  return (
    <div className="space-y-[18px] rounded-xl bg-defaults-primary-background-primary p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => {
          void navigate(ROUTE_PATH.BOARD_NOTICE)
        }}
      >
        <h2 className="pretendard-15Bold">공지사항</h2>
        {!isNoticeTopThreeLoading && hasNotice && (
          <div className="flex items-center pretendard-12Medium text-defaults-secondary-text-secondary">
            <span>더보기</span>
            <img className="h-3 w-3" src="/assets/icons/ArrowRight.svg" alt="화살표 아이콘" />
          </div>
        )}
      </button>

      {isNoticeTopThreeLoading && (
        <ul className="flex w-full flex-col items-start justify-center gap-[9px] self-stretch">
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => {
            return (
              <li key={`notice-skeleton-${String(index)}`} className="w-full">
                <div className="flex w-full items-center gap-[9px]">
                  <SkeletonBase className="h-4 w-16 rounded" />
                  <SkeletonBase className="h-4 flex-1 rounded" />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {!isNoticeTopThreeLoading && isNoticeTopThreeError && (
        <div className="flex h-[calc(100%-47px)] items-center justify-center">
          <TextEmpty className="text-center pretendard-14Regular">
            공지사항을 불러오는데 실패했습니다. <br />
            잠시 후 다시 시도해주세요.
          </TextEmpty>
        </div>
      )}

      {!isNoticeTopThreeLoading && !isNoticeTopThreeError && hasNotice && (
        <ul className="grid w-full grid-cols-[auto_1fr] items-start justify-center gap-x-[9px] gap-y-[9px] self-stretch">
          {noticeTopThree.map((notice) => {
            const moveToDetail = () => {
              void navigate(boardNoticeDetailPath({ uuid: notice.uuid }))
            }

            return (
              <li key={notice.uuid} className="contents">
                <button
                  type="button"
                  className="max-w-16 overflow-hidden text-left pretendard-13Medium text-ellipsis whitespace-nowrap text-defaults-tertiary-text-tertiary"
                  onClick={moveToDetail}
                >
                  {notice.categoryName}
                </button>
                <button
                  type="button"
                  className="overflow-hidden text-left pretendard-14Regular text-ellipsis whitespace-nowrap text-defaults-primary-text-primary"
                  onClick={moveToDetail}
                >
                  {/*
                   * ⚠️ **`sanitizeHtml` + `dangerouslySetInnerHTML`을 쓰지 않는다.**
                   * `formatHtmlText`는 결과가 HTML이지만 레거시는 이 자리에서
                   * 머스태시(`{{ }}`)로 **텍스트로** 출력한다 — 제목에 줄바꿈이 있으면
                   * `<br/>`이 글자로 보인다. 고치면 화면이 달라지므로 그대로 둔다.
                   */}
                  {formatHtmlText({ text: notice.title })}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {!isNoticeTopThreeLoading && !isNoticeTopThreeError && !hasNotice && (
        <div className="flex h-[calc(100%-47px)] items-center justify-center">
          <TextEmpty className="pretendard-14Regular">공지사항이 없습니다.</TextEmpty>
        </div>
      )}
    </div>
  )
}
