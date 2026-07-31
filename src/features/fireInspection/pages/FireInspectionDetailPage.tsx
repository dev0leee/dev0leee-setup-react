import { useMemo, useState } from 'react'

import {
  FIRE_INSPECTION_MESSAGE,
  FIRE_INSPECTION_RADIO_OPTIONS,
  INSPECTION_CATEGORIES,
} from '@/features/fireInspection/constants/fireInspection'
import { useFireInspectionDetail } from '@/features/fireInspection/queries/useFireInspection'
import {
  FIRE_INSPECTION_ANSWER,
  type InspectionCategory,
} from '@/features/fireInspection/types/fireInspection'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { InputRadioList } from '@/shared/components/common/InputRadioList'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { cn } from '@/shared/utils/cn'
import { formatIsoStringDate } from '@/shared/utils/formatIsoStringDate'

/**
 * 점검 상세 (F4). 레거시 `FireInspectionHistoryDetailView.vue` 이식.
 *
 * 제출된 점검을 읽기 전용으로 재현한다. F2a와 같은 점검표지만 **별도 구현**이고
 * 타이포·패딩이 서로 다르다 — **통일하지 않는다**(명세 「반드시 지켜야 할 것」 8).
 *
 * | 항목       | F2a             | F4                |
 * | ---------- | --------------- | ----------------- |
 * | 초기 상태  | 전부 접힘       | **전부 펼침**     |
 * | 번호 배지  | 완료/미완료 분기 | **항상 파랑**     |
 * | 카테고리명 | `16SemiBold`    | **`18Medium`**    |
 * | 항목 라벨  | `18SemiBold`    | **`16SemiBold`**  |
 * | 헤더 패딩  | `px-3 py-5`     | **`px-5 py-4`**   |
 *
 * ⚠️ **AppBar 제목이 동적이다** — `2026.07.15 점검 상세`. 로딩 중에는 `점검 상세`다.
 * 라우트 meta로는 만들 수 없어 화면이 AppBar를 직접 든다.
 *
 * 🔴 **도움말 아이콘에 클릭 핸들러가 없다** — 눌러도 아무 일이 없는 장식이다.
 * F2a에서 복사하면서 툴팁 배선을 빼먹은 것으로 보인다 (`fire-inspection.md` F-Q16).
 * 등가 이관이라 그대로 뒀다.
 *
 * 🔴 **조회 실패·빈 응답이면 AppBar만 있는 흰 화면이 된다** — 에러 UI가 없다 (F-Q15).
 *
 * ⚠️ **항목 전체가 `NOT_APPLICABLE`이면 카테고리를 "해당없음"으로 본다** — 칩만 보이고
 * 화살표도 없으며 열리지 않는다.
 */
export const FireInspectionDetailPage = () => {
  const { inspectionDetail, isInspectionDetailLoading } = useFireInspectionDetail()
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({})

  // ⚠️ 레거시는 렌더마다 `answerList`를 `find`로 훑었다(10 × 21 × 21). Map을 한 번 만든다 —
  // 결과는 같다
  const answerMap = useMemo(() => {
    return new Map(
      (inspectionDetail?.questionAnswerList ?? []).map((answer) => {
        return [answer.questionId, answer.answer]
      }),
    )
  }, [inspectionDetail])

  const appBarTitle = inspectionDetail?.submissionDateTime
    ? `${formatIsoStringDate({ dateTimeString: inspectionDetail.submissionDateTime }).dotDate()} 점검 상세`
    : FIRE_INSPECTION_MESSAGE.detailTitleFallback

  // **기본값이 `true`다** — 진입 시 10개가 전부 펼쳐져 있다 (F2a와 반대)
  const isCategoryExpanded = (categoryId: number) => {
    return expandedCategories[categoryId] ?? true
  }

  const isCategoryNotApplicable = (category: InspectionCategory) => {
    return category.items.every((item) => {
      return answerMap.get(item.questionId) === FIRE_INSPECTION_ANSWER.NOT_APPLICABLE
    })
  }

  return (
    <div className="flex h-full w-full flex-col bg-base-b-white">
      <AppBar title={appBarTitle} />

      <div className="flex flex-1 flex-col overflow-auto pt-12">
        {isInspectionDetailLoading ? (
          <SpinnerDots />
        ) : (
          inspectionDetail && (
            <div className="flex flex-col gap-3 px-5 py-6">
              {INSPECTION_CATEGORIES.map((category) => {
                const isNotApplicable = isCategoryNotApplicable(category)
                const isExpanded = isCategoryExpanded(category.categoryId)

                return (
                  <div
                    key={category.categoryId}
                    className="overflow-hidden rounded-xl border border-defaults-tertiary-border-tertiary"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-5 py-4"
                      onClick={() => {
                        if (isNotApplicable) return

                        setExpandedCategories((previous) => {
                          return { ...previous, [category.categoryId]: !isExpanded }
                        })
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-default-background-brand pretendard-12Bold text-base-b-white">
                          {category.categoryNumber}
                        </span>
                        <span className="text-left pretendard-18Medium text-defaults-primary-text-primary">
                          {category.categoryName}
                        </span>
                        {/* 🔴 클릭 핸들러가 없다 — 눌러도 툴팁이 뜨지 않는다 (F-Q16) */}
                        {category.description && (
                          <img
                            src="/assets/images/자가점검표/Info.svg"
                            alt="도움말"
                            className="h-[18px] w-[18px]"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isNotApplicable ? (
                          <ChipBase color="gray" variant="fill">
                            {FIRE_INSPECTION_MESSAGE.notApplicable}
                          </ChipBase>
                        ) : (
                          <img
                            src="/assets/icons/ChevronDown.svg"
                            alt="펼치기/접기"
                            aria-hidden
                            className={cn(
                              'h-5 w-5 transition-transform duration-200',
                              isExpanded && 'rotate-180',
                            )}
                          />
                        )}
                      </div>
                    </button>

                    {!isNotApplicable && isExpanded && (
                      <div className="flex flex-col gap-6 border-t border-defaults-tertiary-border-tertiary px-5 py-6">
                        {category.items.map((item) => {
                          return (
                            <div key={item.itemId} className="flex flex-col gap-3">
                              <span className="pretendard-16SemiBold text-defaults-primary-text-primary">
                                {item.label}
                              </span>
                              <InputRadioList
                                name={`detail-item-${item.itemId}`}
                                list={FIRE_INSPECTION_RADIO_OPTIONS}
                                value={answerMap.get(item.questionId)}
                                showCheckbox
                                disabled
                                roundType="round-square"
                                className="p-4"
                                onChange={() => {
                                  // 읽기 전용이다
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
