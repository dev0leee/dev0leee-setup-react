import { useCallback, useMemo, useState } from 'react'

import {
  FIRE_INSPECTION_FALLBACK_IMAGE,
  FIRE_INSPECTION_ITEM_IMAGES,
  INSPECTION_CATEGORIES,
} from '@/features/fireInspection/constants/fireInspection'
import {
  FIRE_INSPECTION_ANSWER,
  type FireInspectionAnswer,
  type FireInspectionAnswerPayload,
  type InspectionCategory,
  type InspectionItem,
} from '@/features/fireInspection/types/fireInspection'

/**
 * 점검표 작성 상태 전부. 레거시 `useFireInspectionForm.js`(309줄) 1:1 이식.
 *
 * ✅ **`lodash` 8개 함수(`every`·`filter`·`forEach`·`get`·`isEmpty`·`size`·`sumBy`·`find`)를
 * 전부 표준 JS로 바꿨다** — 의존성을 추가하지 않고 옮길 수 있었다.
 *
 * ⚠️ **레거시는 이 반환 객체를 자식에게 2단 props로 내렸다**(props drilling).
 * 타깃은 Context로 바꿨다 — 화면 동작은 동일하다 (`FireInspectionFormContext`).
 */
export const useFireInspectionForm = () => {
  /** 항목별 응답. **진행률의 유일한 출처**다 */
  const [inspectionResults, setInspectionResults] = useState<Record<number, FireInspectionAnswer>>(
    {},
  )
  const [notApplicableCategories, setNotApplicableCategories] = useState<Record<number, boolean>>(
    {},
  )
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({})
  /** 카테고리 툴팁 — **한 번에 하나만** */
  const [activeTooltipId, setActiveTooltipId] = useState<number | null>(null)
  /** 항목 툴팁 — **여러 개 동시 오픈 허용**. 카테고리와 정책이 다르다 */
  const [activeItemTooltips, setActiveItemTooltips] = useState<Record<number, boolean>>({})
  const [imageSliderIndex, setImageSliderIndex] = useState<Record<number, number>>({})

  const isCategoryCompleted = useCallback(
    (category: InspectionCategory) => {
      if (notApplicableCategories[category.categoryId]) return true
      if (category.items.length === 0) return false

      return category.items.every((item) => {
        return Boolean(inspectionResults[item.itemId])
      })
    },
    [inspectionResults, notApplicableCategories],
  )

  const getCategoryProgress = useCallback(
    (category: InspectionCategory) => {
      const total = category.items.length
      // ⚠️ 레거시는 해당없음이면 `total`로 덮어썼다. `toggleNotApplicable`이 모든 항목에
      // `NOT_APPLICABLE`을 넣으므로 세어도 같은 값이다 — 중복 계산이라 세는 쪽만 남겼다
      const completed = category.items.filter((item) => {
        return Boolean(inspectionResults[item.itemId])
      }).length

      return { completed, total }
    },
    [inspectionResults],
  )

  /** ⚠️ **해당없음 카테고리는 절대 펼치지 않는다.** 기본값은 접힘이다 */
  const isCategoryExpanded = useCallback(
    (categoryId: number) => {
      if (notApplicableCategories[categoryId]) return false

      return expandedCategories[categoryId] ?? false
    },
    [expandedCategories, notApplicableCategories],
  )

  /**
   * 아코디언 토글.
   *
   * ⚠️ **새로 펼칠 때 "이미 완료된" 다른 카테고리만 접는다.** 미완료 카테고리는 여러 개가
   * 동시에 펼쳐진 채로 남는다 — **단일 오픈 아코디언이 아니다.** 이 규칙이 핵심 UX다.
   */
  const toggleCategory = useCallback(
    (categoryId: number) => {
      if (notApplicableCategories[categoryId]) return

      const isOpening = !expandedCategories[categoryId]

      setExpandedCategories((previous) => {
        const next = { ...previous }

        if (isOpening) {
          INSPECTION_CATEGORIES.forEach((category) => {
            if (
              category.categoryId !== categoryId &&
              previous[category.categoryId] &&
              isCategoryCompleted(category)
            ) {
              next[category.categoryId] = false
            }
          })
        }

        next[categoryId] = isOpening

        return next
      })

      if (isOpening) return

      // 접을 때 그 카테고리의 툴팁을 정리한다
      setActiveTooltipId((previous) => {
        return previous === categoryId ? null : previous
      })

      const category = INSPECTION_CATEGORIES.find((item) => {
        return item.categoryId === categoryId
      })
      if (!category) return

      setActiveItemTooltips((previous) => {
        const next = { ...previous }
        category.items.forEach((item) => {
          next[item.itemId] = false
        })

        return next
      })
    },
    [expandedCategories, notApplicableCategories, isCategoryCompleted],
  )

  const toggleTooltip = useCallback((categoryId: number) => {
    setActiveTooltipId((previous) => {
      return previous === categoryId ? null : categoryId
    })
  }, [])

  const toggleItemTooltip = useCallback((itemId: number) => {
    setActiveItemTooltips((previous) => {
      return { ...previous, [itemId]: !previous[itemId] }
    })
  }, [])

  /**
   * `해당없음` 토글.
   *
   * 🔴 **해제하면 그 카테고리의 응답이 전부 사라진다.** 정상/불량을 다 고른 뒤 실수로
   * 켰다가 다시 끄면 입력이 날아간다 (`fire-inspection.md` F-Q5). 레거시 그대로다.
   */
  const toggleNotApplicable = useCallback((category: InspectionCategory) => {
    const { categoryId } = category

    setNotApplicableCategories((previous) => {
      const nextValue = !previous[categoryId]

      setInspectionResults((results) => {
        const next = { ...results }

        category.items.forEach((item) => {
          if (nextValue) {
            next[item.itemId] = FIRE_INSPECTION_ANSWER.NOT_APPLICABLE
            return
          }
          delete next[item.itemId]
        })

        return next
      })

      if (nextValue) {
        setExpandedCategories((expanded) => {
          return { ...expanded, [categoryId]: false }
        })
      }

      return { ...previous, [categoryId]: nextValue }
    })
  }, [])

  const selectAnswer = useCallback((itemId: number, answer: FireInspectionAnswer) => {
    setInspectionResults((previous) => {
      return { ...previous, [itemId]: answer }
    })
  }, [])

  const getSelectedAnswer = useCallback(
    (itemId: number) => {
      return inspectionResults[itemId] ?? undefined
    },
    [inspectionResults],
  )

  /** ⚠️ **빈 배열만 "이미지 없음"이다.** 매핑 누락(`undefined`)은 폴백 이미지를 쓴다 */
  const hasImages = useCallback((item: InspectionItem) => {
    const images = FIRE_INSPECTION_ITEM_IMAGES[item.itemId]

    return !(Array.isArray(images) && images.length === 0)
  }, [])

  const getItemImages = useCallback((item: InspectionItem) => {
    const images = FIRE_INSPECTION_ITEM_IMAGES[item.itemId]

    return images && images.length > 0 ? images : [FIRE_INSPECTION_FALLBACK_IMAGE]
  }, [])

  const getImageIndex = useCallback(
    (itemId: number) => {
      return imageSliderIndex[itemId] ?? 0
    },
    [imageSliderIndex],
  )

  /** 첫 장에서 이전을 누르면 마지막으로 순환한다 */
  const prevImage = useCallback((itemId: number, totalImages: number) => {
    setImageSliderIndex((previous) => {
      const current = previous[itemId] ?? 0

      return { ...previous, [itemId]: current > 0 ? current - 1 : totalImages - 1 }
    })
  }, [])

  const nextImage = useCallback((itemId: number, totalImages: number) => {
    setImageSliderIndex((previous) => {
      const current = previous[itemId] ?? 0

      return { ...previous, [itemId]: current < totalImages - 1 ? current + 1 : 0 }
    })
  }, [])

  const totalItems = useMemo(() => {
    return INSPECTION_CATEGORIES.reduce((sum, category) => {
      return sum + category.items.length
    }, 0)
  }, [])

  /** ⚠️ **키 개수다.** `NOT_APPLICABLE`도 응답으로 센다 */
  const completedItems = Object.keys(inspectionResults).length

  // ⚠️ `Math.round`라 20/21이 **95%**로 보인다
  const progressPercent = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100)
  const isAllCompleted = totalItems > 0 && completedItems === totalItems

  /** ⚠️ **응답이 없는 항목은 제외**한다. 실제로는 21개가 다 차야 제출 버튼이 열린다 */
  const buildQuestionAnswerList = useCallback((): FireInspectionAnswerPayload[] => {
    return INSPECTION_CATEGORIES.flatMap((category) => {
      return category.items.flatMap((item) => {
        const answer = inspectionResults[item.itemId]
        if (!answer) return []

        return [
          {
            sectionId: category.sectionId,
            groupId: category.groupId,
            questionId: item.questionId,
            answer,
          },
        ]
      })
    })
  }, [inspectionResults])

  return {
    notApplicableCategories,
    activeTooltipId,
    activeItemTooltips,
    getCategoryProgress,
    isCategoryCompleted,
    isCategoryExpanded,
    toggleCategory,
    toggleTooltip,
    toggleItemTooltip,
    toggleNotApplicable,
    selectAnswer,
    getSelectedAnswer,
    getItemImages,
    hasImages,
    prevImage,
    nextImage,
    getImageIndex,
    progressPercent,
    isAllCompleted,
    buildQuestionAnswerList,
  }
}

export type FireInspectionFormValue = ReturnType<typeof useFireInspectionForm>
