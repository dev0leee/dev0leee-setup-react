import { create } from 'zustand'

import { FONT_SIZE_SCALE, FONT_SIZE_SCALE_VALUES } from '@/shared/constants/fontSize'
import { STORAGE_KEY } from '@/shared/constants/storage'
import type { FontSizeScale, FontSizeState } from '@/shared/types/fontSize'

/**
 * 글자 크기 배율. 레거시 `stores/fontSize.js` + `useFontSizeStorage.js` 이식.
 *
 * localStorage 키 `fontSize`에 **문자열 원본**으로 저장한다(JSON 아님) —
 * VueUse `useStorage`의 문자열 직렬화와 같아야 기존 사용자 설정이 이어진다.
 */
const isFontSizeScale = (value: string): value is FontSizeScale => {
  return (FONT_SIZE_SCALE_VALUES as string[]).includes(value)
}

const readFontSize = (): FontSizeScale => {
  const raw = localStorage.getItem(STORAGE_KEY.FONT_SIZE)
  // 알 수 없는 값이 남아 있으면 기본값으로 떨어뜨린다. 잘못된 값은 CSS 변수를 못 찾는다.
  if (!raw || !isFontSizeScale(raw)) return FONT_SIZE_SCALE.MEDIUM
  return raw
}

export const useFontSizeStore = create<FontSizeState>((set) => {
  return {
    fontSize: readFontSize(),

    setFontSize: (fontSize) => {
      localStorage.setItem(STORAGE_KEY.FONT_SIZE, fontSize)
      set({ fontSize })
    },

    setFontSizeByIndex: (index) => {
      const next = FONT_SIZE_SCALE_VALUES[index]
      // 슬라이더 범위를 벗어난 인덱스는 무시한다.
      if (!next) return
      localStorage.setItem(STORAGE_KEY.FONT_SIZE, next)
      set({ fontSize: next })
    },

    resetFontSize: () => {
      localStorage.setItem(STORAGE_KEY.FONT_SIZE, FONT_SIZE_SCALE.MEDIUM)
      set({ fontSize: FONT_SIZE_SCALE.MEDIUM })
    },
  }
})
