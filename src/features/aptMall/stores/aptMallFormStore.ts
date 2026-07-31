import { create } from 'zustand'

import type { AptMallOrderTimeData, AptMallOrderType } from '@/features/aptMall/types/aptMall'

/** 위저드가 고른 메뉴 한 줄. **단가는 유형에 따라 진입 시 확정된다** */
export interface AptMallFormMenu {
  name: string
  uuid: string
  /** `VISIT`이면 `price`, `TAKEOUT`이면 `takeOutPrice`가 들어온다 */
  price: number
  orderMenuCountEqualsOrderPersonCountFlag: boolean
  count: number
}

export interface AptMallFormData {
  selectedType?: { label: string; icon: string; key: AptMallOrderType }
  date?: Date
  personCount?: number
  time?: AptMallOrderTimeData
  menu?: AptMallFormMenu[]
  totalPrice?: number
}

interface AptMallFormState {
  aptMallFormData: AptMallFormData
  /** 메뉴를 한 번 채웠는지. `이전`으로 돌아갈 때만 풀린다 */
  menuInitialized: boolean
  setAptMallFormData: (patch: AptMallFormData) => void
  setMenuInitialized: (value: boolean) => void
  resetAptMallFormData: () => void
}

/**
 * 예약 위저드 5단계가 공유하는 상태. 레거시 Pinia `useAptMallFormStore` 이식.
 *
 * **누적 병합이다** — 각 단계가 자기 필드만 얹는다. `menu`가 들어오면 `totalPrice`를
 * 함께 계산한다(레거시 동작).
 *
 * ✅ **레거시는 `personCount`에 값이 아니라 `Ref`를 넣었다.** Vue의 자동 언랩 덕에
 * 숫자처럼 읽혔고, 그래서 **인원을 바꾸면 시간대 잔여석 판정이 저절로 갱신**됐다.
 * React에는 그 언랩이 없으므로 **숫자를 저장하고 판정이 스토어를 구독하도록** 배선했다 —
 * 화면 동작(인원 변경 → 잔여석 판정 즉시 갱신)이 등가의 기준이다 (`apt-mall.md` §4-1).
 *
 * ⚠️ **드로어를 닫지 않고 화면을 벗어나면 상태가 남는다.** 다시 들어와 `예약하기`를
 * 누르면 단계는 0부터인데 이전 `menu`·`time`·`date`가 남아 있다 (AM-Q6). 레거시 그대로다.
 */
export const useAptMallFormStore = create<AptMallFormState>()((set) => {
  return {
    aptMallFormData: {},
    menuInitialized: false,
    setAptMallFormData: (patch) => {
      set((state) => {
        const next = { ...state.aptMallFormData, ...patch }

        if (patch.menu) {
          next.totalPrice = patch.menu.reduce((sum, item) => {
            return sum + (item.price || 0) * item.count
          }, 0)
        }

        return { aptMallFormData: next }
      })
    },
    setMenuInitialized: (menuInitialized) => {
      set({ menuInitialized })
    },
    resetAptMallFormData: () => {
      set({ aptMallFormData: {}, menuInitialized: false })
    },
  }
})
