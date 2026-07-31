import { FireInspectionItemImage } from '@/features/fireInspection/components/FireInspectionItemImage'
import { FireInspectionTooltip } from '@/features/fireInspection/components/FireInspectionTooltip'
import { FIRE_INSPECTION_RADIO_OPTIONS } from '@/features/fireInspection/constants/fireInspection'
import { useFireInspectionFormContext } from '@/features/fireInspection/context/fireInspectionFormContext'
import type {
  FireInspectionAnswer,
  InspectionItem,
} from '@/features/fireInspection/types/fireInspection'
import { InputRadioList } from '@/shared/components/common/InputRadioList'

/**
 * 점검 항목 하나 (F2a). 레거시 `FireInspectionItem.vue`.
 *
 * ⚠️ **도움말 아이콘은 `tooltipText`가 있는 항목에만 뜬다** — 21개 중 2개(3번 카테고리)뿐이다.
 * ⚠️ **항목 툴팁은 여러 개가 동시에 열릴 수 있다** (카테고리 툴팁은 하나만).
 * ⚠️ **선택 상태에 배경색이 없다.** 레거시가 생성되지 않는 클래스를 써서 실측 결과
 * 투명이었고, 테두리·글자색·체크박스 이미지로만 구분된다 (`broken-styles.md` §0).
 */
export const FireInspectionItem = ({ item }: { item: InspectionItem }) => {
  const {
    hasImages,
    getItemImages,
    getImageIndex,
    getSelectedAnswer,
    selectAnswer,
    activeItemTooltips,
    toggleItemTooltip,
    prevImage,
    nextImage,
  } = useFireInspectionFormContext()

  const images = getItemImages(item)

  return (
    <div className="flex flex-col gap-3">
      {hasImages(item) && (
        <FireInspectionItemImage
          images={images}
          currentIndex={getImageIndex(item.itemId)}
          alt={item.label}
          onPrev={() => {
            prevImage(item.itemId, images.length)
          }}
          onNext={() => {
            nextImage(item.itemId, images.length)
          }}
        />
      )}

      <div className="relative flex items-center gap-1">
        <span className="pretendard-18SemiBold text-defaults-primary-text-primary">
          {item.label}
        </span>
        {item.tooltipText && (
          <img
            src="/assets/images/자가점검표/Info.svg"
            alt="도움말"
            className="h-[18px] w-[18px] shrink-0 cursor-pointer"
            onClick={(event) => {
              event.stopPropagation()
              toggleItemTooltip(item.itemId)
            }}
          />
        )}
        {item.tooltipText && activeItemTooltips[item.itemId] && (
          <FireInspectionTooltip
            content={item.tooltipText}
            positionClass="left-0 top-full mt-1 max-w-[300px]"
            onClose={(event) => {
              event.stopPropagation()
              toggleItemTooltip(item.itemId)
            }}
          />
        )}
      </div>

      {item.description && (
        <p className="pretendard-16Regular text-defaults-secondary-text-secondary">
          {item.description}
        </p>
      )}

      <InputRadioList
        name={`item-${item.itemId}`}
        list={FIRE_INSPECTION_RADIO_OPTIONS}
        value={getSelectedAnswer(item.itemId)}
        showCheckbox
        roundType="round-square"
        className="p-4"
        onChange={(key) => {
          selectAnswer(item.itemId, key as FireInspectionAnswer)
        }}
      />
    </div>
  )
}
