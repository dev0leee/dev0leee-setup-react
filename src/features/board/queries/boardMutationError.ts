import { BOARD_ERROR_CODE, BOARD_ERROR_MESSAGE } from '@/features/board/constants/board'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'

/**
 * 게시판 mutation 실패 처리. 레거시가 훅마다 복사해 둔 `switch (errorCode)`를 모은 것이다.
 *
 * ⚠️ **`handlesBlackList`가 게시판마다 다르다.** 소통공간은 `BOARD_BLACK_LIST`를
 * 전용 안내문으로 바꿔주지만, **민원공간은 4개 mutation에서 그 분기를 빠뜨려**
 * 사용자가 서버 원문 메시지를 그대로 본다 (`board.md` §4 #10~#13).
 * 등가 이관이라 그 차이를 유지한다 — 호출부가 명시적으로 넘긴다.
 *
 * ⚠️ `BOARD_BLACK_LIST` 안내는 `<br/>`을 포함한 **HTML**이라 `text`가 아니라 `html`로 넘긴다.
 */
export const showBoardMutationError = ({
  error,
  handlesBlackList,
  handlesFileUploadFail = false,
}: {
  error: ApiError
  /** 민원공간의 일부 mutation은 `false`다 — 레거시가 분기를 빠뜨렸다 */
  handlesBlackList: boolean
  /** 파일을 올리는 mutation만 `true` */
  handlesFileUploadFail?: boolean
}): void => {
  if (handlesFileUploadFail && error.code === BOARD_ERROR_CODE.FILE_UPLOAD_FAIL) {
    showErrorModal({ text: BOARD_ERROR_MESSAGE.FILE_UPLOAD_FAIL })
    return
  }

  if (handlesBlackList && error.code === BOARD_ERROR_CODE.BLACK_LIST) {
    showErrorModal({ html: BOARD_ERROR_MESSAGE.BLACK_LIST_HTML })
    return
  }

  showErrorModal({ text: error.message })
}
