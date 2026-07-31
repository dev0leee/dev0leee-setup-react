/**
 * 항목 이미지. 레거시 `FireInspectionItemImage.vue`.
 *
 * ⚠️ **화살표는 이미지가 2장 이상일 때만 뜬다** — 21개 항목 중 `itemId: 14`(완강기 외형)
 * 하나뿐이다. 인디케이터(점)는 없다.
 */
export const FireInspectionItemImage = ({
  images,
  currentIndex,
  alt,
  onPrev,
  onNext,
}: {
  images: string[]
  currentIndex: number
  alt: string
  onPrev: () => void
  onNext: () => void
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <img
          src={images[currentIndex]}
          alt={alt}
          className="min-h-[200px] w-full rounded-xl object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="absolute top-1/2 left-2 -translate-y-1/2"
              onClick={onPrev}
            >
              <img src="/assets/icons/ArrowFrameCaretLeft.svg" alt="이전" className="h-8 w-8" />
            </button>
            <button
              type="button"
              className="absolute top-1/2 right-2 -translate-y-1/2"
              onClick={onNext}
            >
              <img src="/assets/icons/ArrowFrameCaretRight.svg" alt="다음" className="h-8 w-8" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
