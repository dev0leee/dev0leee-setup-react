/**
 * 접근성 글자 크기 배율. 레거시 `constants/mypage.js` 이식.
 * 값 문자열이 `index.css`의 `[data-font-size='...']` 선택자와 짝이다.
 */
export const FONT_SIZE_SCALE = {
  VERY_SMALL: 'very-small',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  VERY_LARGE: 'very-large',
} as const

/** 슬라이더 인덱스 ↔ 값 변환에 쓴다. 순서가 곧 단계다 */
export const FONT_SIZE_SCALE_VALUES = Object.values(FONT_SIZE_SCALE)

export const FONT_SIZE_SCALE_LABEL = {
  [FONT_SIZE_SCALE.VERY_SMALL]: '매우 작게',
  [FONT_SIZE_SCALE.SMALL]: '작게',
  [FONT_SIZE_SCALE.MEDIUM]: '보통',
  [FONT_SIZE_SCALE.LARGE]: '크게',
  [FONT_SIZE_SCALE.VERY_LARGE]: '매우 크게',
} as const
