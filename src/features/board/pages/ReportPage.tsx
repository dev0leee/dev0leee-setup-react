import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'

import { REPORT_TEXT_MAX_LENGTH } from '@/features/board/constants/board'
import { useReportBoardPost } from '@/features/board/queries/useBoardMutations'
import { BOARD_TYPE, type BoardType } from '@/features/board/types/post'
import { ButtonBase } from '@/shared/components/common/ButtonBase'

/**
 * 게시글 신고 (B20). 레거시 `Report/ReportView.vue` 이식.
 *
 * 🔴 **어느 게시판인지를 라우터 state로만 받는다.** 상세 화면의 더보기가
 * `navigate(path, { state: { boardType } })`로 넘긴다. **새로고침·딥링크로 직접
 * 들어오면 state가 없어 `undefined`가 되고, 그러면 민원공간 API를 때린다** —
 * 소통공간 글을 신고하려다 엉뚱한 엔드포인트로 가고 성공 시 `/board/complaints`로
 * 이동한다. 웹뷰라 새로고침이 드물 뿐 구조적 결함이다.
 * **등가 이관이라 그대로 옮겼다** (`board.md` §5-13).
 *
 * ⚠️ **`disabled`가 없어 빈 내용으로도 제출된다.** 버튼 색만 회색으로 바뀐다.
 *
 * ⚠️ **글자 수를 `maxlength`가 아니라 JS로 자른다** — 붙여넣기가 300자에서 잘린다.
 */
export const ReportPage = () => {
  const { postUuid } = useParams()
  const location = useLocation()
  const [reportText, setReportText] = useState('')

  const state = location.state as { boardType?: BoardType } | null
  // ⚠️ state가 없으면 민원공간으로 떨어진다 — 레거시의 `else` 분기와 같다
  const boardType: BoardType =
    state?.boardType === BOARD_TYPE.COMMUNITY ? BOARD_TYPE.COMMUNITY : BOARD_TYPE.COMPLAINTS

  const { reportPost } = useReportBoardPost({ boardType, postUuid })

  return (
    <div className="flex h-full w-full flex-col items-start gap-[17px] p-5">
      <h2 className="pretendard-18Bold text-defaults-primary-text-primary">
        신고하는 이유를 알려주세요
      </h2>

      <form
        className="flex flex-col items-end justify-end gap-[5px] self-stretch"
        onSubmit={(event) => {
          event.preventDefault()
          reportPost({ content: reportText })
        }}
      >
        <textarea
          value={reportText}
          placeholder="신고 내용을 입력해주세요."
          className="flex h-[216px] w-full flex-col items-start gap-[10px] self-stretch rounded border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-mono px-3 py-[10px] pretendard-16Regular font-[Pretendard] placeholder:text-defaults-tertiary-text-tertiary"
          onChange={(event) => {
            setReportText(event.target.value.substring(0, REPORT_TEXT_MAX_LENGTH))
          }}
        />

        <div className="flex w-full justify-end gap-1 pretendard-13SemiBold text-defaults-tertiary-text-tertiary">
          <span className="font-semibold">글자 수 제한</span>
          <div>
            {reportText.length}/{REPORT_TEXT_MAX_LENGTH}
          </div>
        </div>

        {/* ⚠️ `absolute`인데 위치 기준 조상이 없다 — 레거시 그대로다 (BD-Q15, 실기기 확인) */}
        <ButtonBase
          type="submit"
          className="absolute bottom-0 left-0"
          color={reportText.length >= 1 ? 'alerts-error' : 'defaults-secondary'}
          size="2xl"
          roundType="square"
        >
          신고하기
        </ButtonBase>
      </form>
    </div>
  )
}
