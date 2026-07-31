import { create } from 'zustand'

import type { MovingHouseFormData } from '@/features/movingHouse/types/movingHouse'

interface MovingHouseFormState {
  movingHouseFormData: MovingHouseFormData | undefined
  setMovingHouseFormData: (data: MovingHouseFormData | undefined) => void
}

/**
 * MH3 ↔ MH4 작성 내용 인수. 레거시 Pinia `useMovingHouseFormStore` 이식.
 *
 * **서버 데이터가 아니다** — 사용자가 MH3에서 입력해 아직 제출하지 않은 값이라
 * Query가 아니라 클라이언트 상태가 맞다 (`04-state.md`).
 *
 * ⚠️ **MH4에서 뒤로 오면 MH3의 폼이 전부 복원된다.** `그만두기`와 제출 성공에서만 비운다.
 * ⚠️ `moveDate`가 `Date` 객체라 **persist하지 않는다** — 레거시도 메모리에만 뒀다.
 * 새로고침하면 사라지고, MH4를 직접 열면 전 필드가 `-`로 보인다
 * (`moving-house.md` MH-Q15 · `deferred.md` D-97).
 */
export const useMovingHouseFormStore = create<MovingHouseFormState>()((set) => {
  return {
    movingHouseFormData: undefined,
    setMovingHouseFormData: (movingHouseFormData) => {
      set({ movingHouseFormData })
    },
  }
})
