import { REPAIR_STATE } from '@/features/repair/types/repair'
import type { ChipColor } from '@/shared/types/chip'
import type { ModalData } from '@/shared/types/overlay'

/** 하자보수 상수. 레거시 `constants/domain/repair.js`(60줄) 전문 이식 */

export const REPAIR_TOAST_MESSAGE = {
  create: '접수되었습니다',
  delete: '취소되었습니다',
  edit: '수정되었습니다',
} as const

/**
 * 첨부 실패 문구.
 * ⚠️ **`가능 합니다` 띄어쓰기와 `10M` 표기가 원문 그대로다.** 실제 상한은 10,000,000 B다.
 */
export const REPAIR_IMAGE_MESSAGE = {
  countLimit: '이미지는 최대 5장까지만 첨부할 수 있습니다',
  sizeLimit: '파일 사이즈는 10M 이하만 업로드 가능 합니다',
  fileTypeLimit: 'jpg, jpeg, png, gif만 첨부 가능합니다',
} as const

export type RepairImageErrorType = keyof typeof REPAIR_IMAGE_MESSAGE

/** 게시글 폼과 값이 같다 (`board.md` §3-4) */
export const REPAIR_IMAGE_LIMIT = {
  MAX_COUNT: 5,
  MAX_SIZE: 10000000,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
} as const

export const REPAIR_STATUS_LIST: { status: string; label: string; color: ChipColor }[] = [
  { status: REPAIR_STATE.WAITING, label: '접수 대기', color: 'gray' },
  { status: REPAIR_STATE.RECEIVED, label: '접수 완료', color: 'orange' },
  { status: REPAIR_STATE.COMPLETED, label: '처리 완료', color: 'blue' },
  { status: REPAIR_STATE.IMPOSSIBLE, label: '처리 불가', color: 'red' },
]

export const REPAIR_LIST_ITEM_FIELD = [
  { key: 'location', label: '위치' },
  { key: 'content', label: '내용' },
] as const

export const REPAIR_DETAIL_CONTENT_FIELD = [
  { key: 'receiptNum', label: '접수번호' },
  { key: 'createdDate', label: '접수일시' },
  { key: 'location', label: '위치' },
  { key: 'emergencyPhone', label: '비상연락처' },
  { key: 'content', label: '접수내용' },
  { key: 'requirement', label: '요청사항' },
] as const

export const REPAIR_DETAIL_ANSWER_FIELD = [
  { key: 'repairState', label: '접수상태' },
  { key: 'visitDateTime', label: '방문일자' },
  { key: 'adminComment', label: '전달사항' },
] as const

export const REPAIR_DETAIL_MODAL_DATA: ModalData = {
  title: '하자 접수 취소',
  description: ['접수를 취소하시면 접수 내역이 사라집니다.', '취소하시겠어요?'],
  firstButton: '닫기',
  secondButton: '접수취소',
}

/**
 * 수정할 수 없는 상태에서 `수정`을 눌렀을 때.
 *
 * ⚠️ **상태 라벨을 문구에 그대로 끼운다** — `처리 불가된 접수는 수정할 수 없습니다`처럼
 * 어색해지는 조합이 나온다 (`repair.md` RP-Q6). 그대로 옮긴다.
 */
export const getRepairNonEditableModalData = ({ status }: { status: string | undefined }) => {
  const label = REPAIR_STATUS_LIST.find((item) => {
    return item.status === status
  })?.label

  return {
    title: `${label}`,
    description: `${label}된 접수는 수정할 수 없습니다`,
    firstButton: '확인',
  }
}

export const REPAIR_MESSAGE = {
  listEmpty: '하자 접수 이력이 없습니다',
  statusTitle: '접수 현황',
  historyTitle: '접수 이력',
  submitButton: '접수하기',
  cancelButton: '접수 취소하기',
  contentTitle: '접수 내용',
  answerTitle: '접수 답변',
  /** `RECEIVED` 상태에서 취소 버튼 대신 뜨는 안내 */
  cannotCancel:
    '접수가 완료되어 직접 접수 취소가 불가능합니다. 접수 취소를 원할 경우 관리사무소에 문의 부탁드립니다.',
} as const

/**
 * 폼을 벗어날 때 뜨는 확인 모달.
 *
 * ✅ **등록은 `작성 그만두기`, 수정은 `수정 그만두기`다.** 레거시는 경로 판정이 틀려
 * (`'write'`를 찾는데 라우트는 `/repair/create`) **등록 화면에서도 수정 문구**가 떴다.
 * 사용자 결정(RP-Q1)으로 고쳤다.
 */
export const REPAIR_WRITE_BACK_MODAL_DATA: ModalData = {
  title: '작성 그만두기',
  description: ['작성을 그만두시겠습니까?', '변경된 내용은 저장되지 않습니다'],
  firstButton: '취소',
  secondButton: '그만두기',
}

export const REPAIR_EDIT_BACK_MODAL_DATA: ModalData = {
  title: '수정 그만두기',
  description: ['수정을 그만두시겠습니까?', '변경된 내용은 저장되지 않습니다'],
  firstButton: '취소',
  secondButton: '그만두기',
}

/** ✅ 등록 화면 제목. **사용자 결정(RP-Q1)으로 `하자보수 등록`이다** */
export const REPAIR_FORM_TITLE = {
  create: '하자보수 등록',
  edit: '하자보수 수정',
} as const
