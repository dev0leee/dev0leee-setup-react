import { FONT_SIZE_SCALE_VALUES } from '@/shared/constants/fontSize'
import { useFontSizeStore } from '@/shared/stores/fontSizeStore'
import { cn } from '@/shared/utils/cn'

/**
 * 글자 크기 슬라이더. 레거시 `MyPageFontSizeSlider.vue` 이식.
 *
 * `<progress>`(진행률, 클릭 불가)와 `<input type="range">`(실제 입력)를 **겹쳐 놓는다.**
 * range의 트랙을 투명하게 만들고 그 아래 progress를 깔아 채워진 부분을 그린다 —
 * range 하나로는 브라우저별로 채우기 색을 지정할 수 없기 때문이다.
 *
 * ⚠️ **의사요소 스타일은 `index.css`에 있다.** `::-webkit-slider-thumb` 같은 것은
 * Tailwind 유틸리티로 표현할 수 없다 (`14-styling.md` 예외). 클래스명이
 * `font-size-progress`·`font-size-range`로 레거시(`progress-bar`·`range-input`)와
 * 다른 이유는 전역 CSS에 들어가기 때문이다 — 그만큼 이름이 구체적이어야 한다.
 * 스타일 값은 한 글자도 바꾸지 않았다.
 */
export const MyPageFontSizeSlider = () => {
  const fontSize = useFontSizeStore((state) => {
    return state.fontSize
  })
  const setFontSizeByIndex = useFontSizeStore((state) => {
    return state.setFontSizeByIndex
  })

  const stepCount = FONT_SIZE_SCALE_VALUES.length
  const currentIndex = FONT_SIZE_SCALE_VALUES.indexOf(fontSize)

  return (
    <div className="flex gap-3">
      <div className="text-sm text-defaults-secondary-text-secondary">가-</div>

      <div className="flex-1">
        <div className="relative">
          <progress
            value={currentIndex}
            max={stepCount - 1}
            className="font-size-progress pointer-events-none absolute top-3 z-[5] h-2 w-full appearance-none rounded-md border-0 transition-all duration-300 ease-in-out"
          />
          <input
            value={currentIndex}
            type="range"
            min={0}
            max={stepCount - 1}
            step={1}
            aria-label="글자 크기"
            className="font-size-range relative z-10 h-7 w-full appearance-none bg-transparent"
            onChange={(event) => {
              setFontSizeByIndex(Number(event.target.value))
            }}
          />
        </div>

        <div className="mt-3 flex justify-between px-1">
          {FONT_SIZE_SCALE_VALUES.map((scale, index) => {
            return (
              <div
                key={scale}
                className={cn(
                  'h-2 w-2 rounded-full transition-all duration-300 ease-in-out',
                  index === currentIndex
                    ? 'scale-125 bg-brand-default-background-brand'
                    : 'scale-100 bg-neutral-b-gray-300',
                )}
              />
            )
          })}
        </div>
      </div>

      <div className="text-sm text-defaults-secondary-text-secondary">가+</div>
    </div>
  )
}
