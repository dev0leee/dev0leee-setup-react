import type { ComponentType } from 'react'

import { MainCardAPass } from '@/features/main/components/cards/MainCardAPass'
import { MainCardManagementFee } from '@/features/main/components/cards/MainCardManagementFee'
import { MainCardParkingMileage } from '@/features/main/components/cards/MainCardParkingMileage'
import { MainCardReservation } from '@/features/main/components/cards/MainCardReservation'
import { MainCardVisitorPass } from '@/features/main/components/cards/MainCardVisitorPass'
import {
  CARD_BASE_CLASS,
  CARD_ORDER_PRESET_WITHOUT_MANAGEMENT_FEE,
  CARD_ORDER_PRESETS,
  FALLBACK_LAYOUT_STRUCTURE,
  LAYOUT_STRUCTURE,
} from '@/features/main/constants/cardLayout'
import {
  type CardLayoutType,
  type LayoutCell,
  MAIN_CARD_ID,
  type MainCardId,
  type MainCardProps,
  type PlacedMainCard,
} from '@/features/main/types/card'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'

/**
 * 카드 내부 배치를 정한다. 레거시 `getCardLayoutType` 이식.
 *
 * **카드마다 규칙이 다르다.** 관리비는 언제나 세로, 마일리지는 혼자일 때만 세로,
 * 나머지는 개수·행 위치로 갈린다. 표로 정리하면 이렇다:
 *
 * | 카드           | 규칙                                                     |
 * | -------------- | -------------------------------------------------------- |
 * | managementFee  | 항상 `vertical`                                          |
 * | parkingMileage | 1장이면 `vertical`, 아니면 `horizontal`                   |
 * | apass          | 1장 → `horizontal` · 4장 2행 → `horizontal` · 그 외 세로  |
 * | visitorPass    | 2장 → `vertical` · 3장 1행 → `vertical` · 그 외 가로      |
 * | reservation    | 1행이면 `vertical`, 아니면 `horizontal`                   |
 */
const getCardLayoutType = ({
  cardId,
  rowIndex,
  totalCards,
}: {
  cardId: MainCardId
  rowIndex: number
  totalCards: number
}): CardLayoutType => {
  if (cardId === MAIN_CARD_ID.MANAGEMENT_FEE) return 'vertical'

  if (cardId === MAIN_CARD_ID.PARKING_MILEAGE) {
    return totalCards === 1 ? 'vertical' : 'horizontal'
  }

  if (cardId === MAIN_CARD_ID.APASS) {
    if (totalCards === 1) return 'horizontal'
    if (totalCards === 4 && rowIndex === 1) return 'horizontal'
    return 'vertical'
  }

  if (cardId === MAIN_CARD_ID.VISITOR_PASS) {
    if (totalCards === 2) return 'vertical'
    if (totalCards === 3 && rowIndex === 0) return 'vertical'
    return 'horizontal'
  }

  if (cardId === MAIN_CARD_ID.RESERVATION) {
    return rowIndex === 0 ? 'vertical' : 'horizontal'
  }

  return 'horizontal'
}

/**
 * 카드 너비 클래스. 레거시 `getCardWidthClass` 이식.
 *
 * 1행은 `1/3 + 2/3`(1장이면 `full`), 2행은 개수에 따라 `full` 또는 `1/2`다.
 * **5장 배치의 중첩 카드(`colIndex >= 3`)는 부모 컨테이너가 이미 `w-1/2`라 `w-full`이다.**
 */
const getCardWidthClass = ({
  rowIndex,
  colIndex,
  totalCards,
}: {
  rowIndex: number
  colIndex: number
  totalCards: number
}): string => {
  if (rowIndex === 0) {
    if (totalCards === 1) return 'w-full'
    return colIndex === 0 ? 'w-1/3' : 'w-2/3'
  }

  if (totalCards === 3) return 'w-full'
  if (totalCards === 5 && colIndex >= 3) return 'w-full'

  return 'w-1/2'
}

/**
 * 메인 카드 그리드 계산. 레거시 `lib/composables/useMainCardLayout.js`(242 LOC) 이식.
 *
 * **아파트 구독 상태에 따라 카드 1~5장을 고르고, 개수별로 순서·배치·크기·내부 방향을
 * 모두 다르게 만든다.** 이 도메인에서 가장 복잡한 로직이고 전부 순수 계산이라
 * 렌더 중에 구한다 — 상태도 effect도 필요 없다.
 *
 * ⚠️ **`parkingMileage`와 `reservation`은 조건이 같다**(주차 구독). 항상 함께 나온다.
 * 그래서 실제로 가능한 카드 수는 0·2·3·4·5다.
 *
 * ⚠️ **`visitorPass`만 조건이 OR다** — 방문증 구독 **또는** 로비폰 구독.
 */
export const useMainCardLayout = () => {
  const {
    hasAptManagementFeeContent,
    hasAptApassContent,
    hasAptParkingContent,
    hasAptVisitorPassContent,
    hasLobbyPhone,
    isResidentDetailInfoLoading,
  } = useResidentDetailInfo()

  const cardRegistry: {
    id: MainCardId
    Component: ComponentType<MainCardProps>
    enabled: boolean
  }[] = [
    { id: MAIN_CARD_ID.APASS, Component: MainCardAPass, enabled: hasAptApassContent },
    {
      id: MAIN_CARD_ID.PARKING_MILEAGE,
      Component: MainCardParkingMileage,
      enabled: hasAptParkingContent,
    },
    {
      id: MAIN_CARD_ID.MANAGEMENT_FEE,
      Component: MainCardManagementFee,
      enabled: hasAptManagementFeeContent,
    },
    {
      id: MAIN_CARD_ID.VISITOR_PASS,
      Component: MainCardVisitorPass,
      enabled: hasAptVisitorPassContent || hasLobbyPhone,
    },
    {
      id: MAIN_CARD_ID.RESERVATION,
      Component: MainCardReservation,
      enabled: hasAptParkingContent,
    },
  ]

  const cards = cardRegistry.filter((card) => {
    return card.enabled
  })
  const cardCount = cards.length

  // 레거시도 개수에 해당하는 프리셋이 없으면 1개용을 쓴다 (카드 0장인 경우)
  const orderPreset =
    cardCount === 4 && !hasAptManagementFeeContent
      ? CARD_ORDER_PRESET_WITHOUT_MANAGEMENT_FEE
      : (CARD_ORDER_PRESETS[cardCount] ?? CARD_ORDER_PRESETS[1] ?? [])

  const enabledCards = [...cards].sort((a, b) => {
    return orderPreset.indexOf(a.id) - orderPreset.indexOf(b.id)
  })

  const structure = LAYOUT_STRUCTURE[cardCount] ?? FALLBACK_LAYOUT_STRUCTURE

  const placeCard = ({
    cardIndex,
    rowIndex,
  }: {
    cardIndex: number
    rowIndex: number
  }): PlacedMainCard | null => {
    const card = enabledCards[cardIndex]
    // 구조가 실제 카드 수보다 많은 자리를 가리킬 때의 방어 코드(레거시 동일)
    if (!card) return null

    return {
      ...card,
      layoutType: getCardLayoutType({ cardId: card.id, rowIndex, totalCards: cardCount }),
      rowIndex,
      colIndex: cardIndex,
    }
  }

  const layoutRows: LayoutCell[][] = structure.map((row, rowIndex) => {
    return row
      .map((cell): LayoutCell | null => {
        // 중첩 배열은 5장 배치의 2행 우측(세로 2장)에서만 나온다
        if (Array.isArray(cell)) {
          const nested = cell
            .map((cardIndex) => {
              return placeCard({ cardIndex, rowIndex })
            })
            .filter((card): card is PlacedMainCard => {
              return card !== null
            })

          return nested.length > 0 ? nested : null
        }

        return placeCard({ cardIndex: cell, rowIndex })
      })
      .filter((cell): cell is LayoutCell => {
        return cell !== null
      })
  })

  const getCardClassName = (card: PlacedMainCard): string => {
    const widthClass = getCardWidthClass({
      rowIndex: card.rowIndex,
      colIndex: card.colIndex,
      totalCards: cardCount,
    })

    return `${CARD_BASE_CLASS} ${widthClass}`
  }

  return { layoutRows, cardCount, getCardClassName, isResidentDetailInfoLoading }
}
