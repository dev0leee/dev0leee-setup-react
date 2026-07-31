import type { ReactNode } from 'react'

import {
  FACE_RECOG_STATUS_CHIP,
  FACE_RECOG_STATUS_CHIP_FALLBACK,
} from '@/features/visit/constants/faceRecog'
import type { FaceRecog } from '@/features/visit/types/visit'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 등록된 얼굴 카드. **V7 목록과 V8 상세가 같은 마크업**을 쓰고 오른쪽 버튼만 다르다
 * (목록은 `상세` 하나, 상세는 `수정`·`삭제` 둘). 레거시는 두 파일에 같은 마크업을
 * 복사해 뒀는데, 한 글자만 어긋나도 픽셀이 갈리므로 여기서 합쳤다.
 *
 * ⚠️ **비고가 없으면 `|` 구분자도 같이 사라진다.**
 * ⚠️ **알 수 없는 상태는 라벨이 빈 문자열이라 빈 칩이 그려진다** — 레거시 그대로다.
 */
export const FaceRecogCard = ({ face, actions }: { face: FaceRecog; actions: ReactNode }) => {
  const statusChip =
    FACE_RECOG_STATUS_CHIP[face.faceRecogStatus ?? ''] ?? FACE_RECOG_STATUS_CHIP_FALLBACK

  return (
    <div className="flex items-center gap-3 rounded-xl border border-defaults-secondary-border-secondary px-4 py-5">
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-[7px]">
          <span className="pretendard-18SemiBold text-defaults-primary-text-primary">
            {face.residentFaceName}
          </span>
          <ChipBase color={statusChip.color}>{statusChip.label}</ChipBase>
        </div>
        <div className="flex items-center gap-1.5">
          {face.faceRecogDescription && (
            <>
              <span className="pretendard-14Medium text-defaults-secondary-text-secondary">
                {face.faceRecogDescription}
              </span>
              <span className="pretendard-14Regular text-defaults-tertiary-text-tertiary">|</span>
            </>
          )}
          <span className="pretendard-14Regular text-defaults-tertiary-text-tertiary">
            등록일 {formatIsoStringDate({ dateTimeString: face.insertDate }).dotDate()}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">{actions}</div>
    </div>
  )
}
