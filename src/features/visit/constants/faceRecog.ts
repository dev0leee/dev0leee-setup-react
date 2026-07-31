import type { ChipColor } from '@/shared/types/chip'

/**
 * 안면인식 상수. 레거시 `constants/domain/faceRecog.js` + 각 화면의 인라인 값.
 */

/** 세대당 등록 가능한 얼굴 수. 넘으면 `신규 등록` 버튼이 사라지고 경고 배너가 뜬다 */
export const MAX_FACES = 10

/**
 * 얼굴인식 API 공통 에러코드 → 사용자 문구 (9종).
 * **API 호출이 실패했을 때** 쓴다.
 */
export const FACE_RECOG_ERROR_MESSAGE: Record<string, string> = {
  RESIDENT_NOT_FOUND: '입주민 정보를 찾을 수 없습니다. 다시 로그인 후 시도해주세요.',
  LOBBY_PHONE_POLICY_NOT_FOUND: '로비폰 정책이 설정되어 있지 않습니다. 관리사무소에 문의해주세요.',
  FACE_RECOG_NOT_FOUND: '얼굴인식 정보가 존재하지 않습니다.',
  FACE_RECOG_APT_NOT_FOUND: '아파트 정보를 찾을 수 없습니다. 관리사무소에 문의해주세요.',
  FACE_RECOG_HOUSEHOLD_NOT_FOUND: '세대 정보를 찾을 수 없습니다. 관리사무소에 문의해주세요.',
  FACE_RECOG_NOT_AVAILABLE: '얼굴인식을 사용할 수 없는 단지입니다. 관리사무소에 문의해주세요.',
  FACE_RECOG_FILE_REQUIRED: '얼굴 이미지가 첨부되지 않았습니다. 다시 촬영해주세요.',
  FACE_RECOG_LIMIT_OVER: '등록 가능한 최대 개수(10개)를 초과했습니다.',
  LOBBY_PHONE_SERVER_ERROR: '로비폰 서버 점검중입니다.',
}

/**
 * 등록 실패(`REJECT`)의 `registCause` → 문구 (6종).
 * **API는 성공했지만 로비폰 서버가 거부한 경우**라 위 표와 쓰임이 다르다.
 * 미정의 코드는 `ExceptionOccurred` 문구로 떨어진다.
 */
export const FACE_RECOG_REGIST_CAUSE_MESSAGE: Record<string, string> = {
  ImageDownloadFailed:
    '얼굴 이미지 다운로드에 실패했습니다. 등록한 사진을 삭제 후 촬영 가이드에 맞게 재등록 해주세요.',
  SdkEngineRejectedFailed:
    '얼굴 인식 SDK 등록에 실패했습니다. 등록한 사진을 삭제 후 촬영 가이드에 맞게 재등록 해주세요.',
  TemplateExtractionFailed:
    '얼굴 템플릿 추출에 실패했습니다. 등록한 사진을 삭제 후 촬영 가이드에 맞게 재등록 해주세요.',
  DuplicatedFace: '이미 중복 등록된 얼굴입니다. 등록한 이전 정보를 삭제 후 재등록 해주세요.',
  FaceGuidOrTemplateIsNull:
    '얼굴 ID 또는 템플릿 데이터가 없습니다. 등록한 사진을 삭제 후 촬영 가이드에 맞게 재등록 해주세요.',
  ExceptionOccurred:
    '등록 중 오류가 발생했습니다. 등록한 사진을 삭제 후 촬영 가이드에 맞게 재등록 해주세요.',
}

/** 미정의 `registCause`가 떨어지는 자리 */
export const FACE_RECOG_REGIST_CAUSE_FALLBACK = 'ExceptionOccurred'

/** 각 화면의 조회·수정 실패 기본 문구. 에러코드 매핑이 없을 때만 쓴다 */
export const FACE_RECOG_MESSAGE = {
  listError: '얼굴인식 목록 조회에 실패하였습니다.',
  detailError: '얼굴인식 정보 조회에 실패하였습니다.',
  putError: '얼굴인식 정보 수정에 실패하였습니다.',
  deleteError: '얼굴인식 정보 삭제에 실패하였습니다.',
  deleted: '삭제되었습니다',
  updated: '등록 정보가 변경되었습니다.',
  empty: '등록된 얼굴이 없습니다.',
  full: '등록 가능한 얼굴 수를 모두 사용했습니다. 새로운 얼굴을 등록하려면 기존 얼굴을 삭제해주세요.',
  pending: '로비폰 서버로 등록 요청 중입니다. 최대 10분 소요됩니다. 잠시만 기다려 주세요.',
} as const

/**
 * 상태 칩.
 *
 * ⚠️ **알 수 없는 상태는 색도 라벨도 없다** — 레거시가 `'gray'` + `''`를 반환해
 * **빈 회색 칩**을 그린다. 그대로 재현한다.
 */
export const FACE_RECOG_STATUS_CHIP: Record<string, { color: ChipColor; label: string }> = {
  COMPLETE: { color: 'success', label: '등록완료' },
  PENDING: { color: 'warning', label: '등록대기' },
  REJECT: { color: 'red', label: '등록실패' },
}

export const FACE_RECOG_STATUS_CHIP_FALLBACK = { color: 'gray', label: '' } as const

/** V8 하단 안내 3줄 */
export const FACE_RECOG_DETAIL_NOTICE = [
  '등록된 사진은 개인정보 보호를 위해 표시되지 않습니다.',
  '수정 시 이름과 관계만 변경할 수 있습니다.',
  '사진을 변경하려면 기존 사진을 삭제 후 다시 등록해주세요.',
] as const

/** 이름·비고 입력의 최대 길이. 두 필드가 같다 */
export const FACE_NAME_MAX_LENGTH = 10

/** V11 촬영 가이드 4개. 예시 이미지가 좋은 예/나쁜 예 한 쌍씩이다 */
export const FACE_GUIDE_ITEMS = [
  {
    title: '정면을 바라봐주세요.',
    good: '/assets/images/face-guide/guide1-good.svg',
    bad: '/assets/images/face-guide/guide1-bad.svg',
  },
  {
    title: '웃거나 찡그리지 마세요.',
    good: '/assets/images/face-guide/guide2-good.svg',
    bad: '/assets/images/face-guide/guide2-bad.svg',
  },
  {
    title: '눈썹, 광대, 볼을 보여주세요.',
    good: '/assets/images/face-guide/guide3-good.svg',
    bad: '/assets/images/face-guide/guide3-bad.svg',
  },
  {
    title: '모자, 마스크 등 얼굴을 가리는 것은 벗어주세요.',
    good: '/assets/images/face-guide/guide4-good.svg',
    bad: '/assets/images/face-guide/guide4-bad.svg',
  },
] as const
