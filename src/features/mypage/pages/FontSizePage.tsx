import { MyPageFontSizeSlider } from '@/features/mypage/components/MyPageFontSizeSlider'
import { FONT_SIZE_PREVIEW_TEXT } from '@/features/mypage/constants/mypage'
import { FONT_SIZE_SCALE_LABEL } from '@/shared/constants/fontSize'
import { useFontSizeStore } from '@/shared/stores/fontSizeStore'

/**
 * 글자 크기 설정 (P7). 레거시 `MyPageFontSizeView.vue` 이식.
 *
 * 설정은 **앱 전역에 즉시 적용된다** — `RootLayout`의 `data-font-size`가 바뀌고
 * `index.css`의 `[data-font-size='...']`가 `--font-scale`을 갈아끼운다.
 * 미리보기 문구가 따로 배율을 받는 게 아니라 화면 전체가 함께 커진다.
 *
 * ⚠️ 레거시 `fontSizeLabel`에는 폴백 버그가 있었다 —
 * `LABELS[value] || LABELS.ETC_FONT_SIZE_SCALES.MEDIUM`에서 뒤쪽이 `undefined`라
 * 접근 시 TypeError였다 (`deferred.md` D-47). 타깃 스토어는 알 수 없는 값을 읽으면
 * `medium`으로 떨어뜨리므로 이 라벨 조회는 항상 성공한다 — **정상 경로 동작은 같고
 * 오염된 값에서 크래시하지 않는다.**
 */
export const FontSizePage = () => {
  const fontSize = useFontSizeStore((state) => {
    return state.fontSize
  })

  return (
    <div className="h-full bg-defaults-secondary-background-secondary">
      {/* `space-y-3`이 자식 없는 요소에 붙어 있고 `p-4`와 `px-3 py-2`가 겹친다.
          뒤쪽 값이 이기므로 실제 여백은 `px-3 py-2`다. 레거시 그대로 옮겼다. */}
      <p className="flex h-[160px] items-center justify-center space-y-3 border-b bg-defaults-primary-background-mono p-4 px-3 py-2 text-center pretendard-15Regular transition-all duration-300 ease-in-out">
        {FONT_SIZE_PREVIEW_TEXT.KO} <br />
        {FONT_SIZE_PREVIEW_TEXT.EN}
      </p>

      <div className="space-y-4 border-t-8 border-defaults-tertiary-border-tertiary bg-defaults-primary-background-mono p-4">
        <p>{FONT_SIZE_SCALE_LABEL[fontSize]}</p>
        <MyPageFontSizeSlider />
      </div>
    </div>
  )
}
