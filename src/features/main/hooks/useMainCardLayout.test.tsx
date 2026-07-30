import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { useMainCardLayout } from '@/features/main/hooks/useMainCardLayout'
import type { LayoutCell, MainCardId } from '@/features/main/types/card'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'

/**
 * 카드 그리드 배치. 레거시 프리셋을 그대로 옮겼는지 **개수별로** 확인한다 —
 * 이 도메인에서 가장 복잡한 로직이고 숫자 하나만 틀려도 화면이 달라진다 (`main.md` §6).
 */

const RESIDENT_UUID = 'resident-uuid-1'

/** 구독 콘텐츠를 주고 배치 결과를 받는다 */
const renderLayout = async ({ contentList }: { contentList: string[] }) => {
  server.use(
    http.get(url({ path: `${API_PREFIX.APARTMANT}/apt-resident/${RESIDENT_UUID}` }), () => {
      return HttpResponse.json({
        success: {
          aptName: '아파트먼트',
          contentList: contentList.map((name) => {
            return { name }
          }),
        },
      })
    }),
  )

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }

  const { result } = renderHook(
    () => {
      return useMainCardLayout()
    },
    { wrapper },
  )

  await waitFor(() => {
    expect(result.current.isResidentDetailInfoLoading).toBe(false)
  })

  return result
}

/** 행/열 구조를 카드 id로만 남긴다. 중첩은 배열로 유지된다 */
const toIdRows = (layoutRows: LayoutCell[][]): (MainCardId | MainCardId[])[][] => {
  return layoutRows.map((row) => {
    return row.map((cell) => {
      if (Array.isArray(cell)) {
        return cell.map((card) => {
          return card.id
        })
      }
      return cell.id
    })
  })
}

describe('useMainCardLayout', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  })

  it('구독이 없으면 카드가 없다', async () => {
    const result = await renderLayout({ contentList: [] })

    expect(result.current.cardCount).toBe(0)
    // 구조는 1장짜리로 폴백하지만 카드가 없어 빈 행만 남는다
    expect(toIdRows(result.current.layoutRows)).toEqual([[]])
  })

  it('A-PASS만 구독하면 1장이 전체 폭을 쓰고 가로 배치다', async () => {
    const result = await renderLayout({ contentList: ['A-PASS'] })

    expect(result.current.cardCount).toBe(1)
    expect(toIdRows(result.current.layoutRows)).toEqual([['apass']])

    const [[card]] = result.current.layoutRows as [[Exclude<LayoutCell, unknown[]>]]
    expect(card.layoutType).toBe('horizontal')
    expect(result.current.getCardClassName(card)).toContain('w-full')
  })

  it('주차만 구독하면 마일리지+방문예약 2장이 1/3 · 2/3로 나온다', async () => {
    // 두 카드가 같은 조건이라 항상 함께 나온다
    const result = await renderLayout({ contentList: ['주차'] })

    expect(result.current.cardCount).toBe(2)
    // 2장 프리셋 순서: apass, reservation, visitorPass, managementFee, parkingMileage
    expect(toIdRows(result.current.layoutRows)).toEqual([['reservation', 'parkingMileage']])

    const [[first, second]] = result.current.layoutRows as [
      [Exclude<LayoutCell, unknown[]>, Exclude<LayoutCell, unknown[]>],
    ]
    expect(result.current.getCardClassName(first)).toContain('w-1/3')
    expect(result.current.getCardClassName(second)).toContain('w-2/3')
    // 1행의 방문예약은 세로, 마일리지는 2장이므로 가로
    expect(first.layoutType).toBe('vertical')
    expect(second.layoutType).toBe('horizontal')
  })

  it('3장이면 2행이 전체 폭 1장이다', async () => {
    const result = await renderLayout({ contentList: ['주차', '관리비'] })

    expect(result.current.cardCount).toBe(3)
    // 3장 프리셋: apass, managementFee, visitorPass, parkingMileage, reservation
    expect(toIdRows(result.current.layoutRows)).toEqual([
      ['managementFee', 'parkingMileage'],
      ['reservation'],
    ])

    const secondRow = result.current.layoutRows[1] as [Exclude<LayoutCell, unknown[]>]
    expect(result.current.getCardClassName(secondRow[0])).toContain('w-full')
  })

  it('4장 + 관리비 미사용이면 A-PASS가 맨 앞으로 온다', async () => {
    // 특수 프리셋이 적용되는 유일한 경우다
    const result = await renderLayout({ contentList: ['주차', 'A-PASS', '방문증'] })

    expect(result.current.cardCount).toBe(4)
    expect(toIdRows(result.current.layoutRows)).toEqual([
      ['apass', 'parkingMileage'],
      ['reservation', 'visitorPass'],
    ])

    // 4장 2행의 A-PASS는 가로지만, 여기서는 1행이라 세로다
    const firstRow = result.current.layoutRows[0] as [Exclude<LayoutCell, unknown[]>, unknown]
    expect(firstRow[0].layoutType).toBe('vertical')
  })

  it('4장 + 관리비 사용이면 기본 프리셋을 쓴다', async () => {
    const result = await renderLayout({ contentList: ['주차', '관리비', 'A-PASS'] })

    expect(result.current.cardCount).toBe(4)
    // 기본 4장 프리셋: managementFee, parkingMileage, reservation, apass, visitorPass
    expect(toIdRows(result.current.layoutRows)).toEqual([
      ['managementFee', 'parkingMileage'],
      ['reservation', 'apass'],
    ])

    // 2행의 A-PASS는 4장일 때 가로다
    const secondRow = result.current.layoutRows[1] as [unknown, Exclude<LayoutCell, unknown[]>]
    expect(secondRow[1].layoutType).toBe('horizontal')
  })

  it('5장이면 2행 우측이 세로 2장으로 쌓인다', async () => {
    const result = await renderLayout({
      contentList: ['주차', '관리비', 'A-PASS', '방문증'],
    })

    expect(result.current.cardCount).toBe(5)
    // 5장 프리셋: apass, parkingMileage, managementFee, visitorPass, reservation
    expect(toIdRows(result.current.layoutRows)).toEqual([
      ['apass', 'parkingMileage'],
      ['managementFee', ['visitorPass', 'reservation']],
    ])

    const nested = result.current.layoutRows[1]?.[1]
    if (!Array.isArray(nested)) throw new Error('5장 배치의 2행 우측이 중첩 배열이 아니다')

    // 중첩 카드는 부모 컨테이너가 w-1/2라 자신은 w-full이다
    nested.forEach((card) => {
      expect(result.current.getCardClassName(card)).toContain('w-full')
    })
  })

  it('로비폰만 있어도 방문 출입관리 카드가 나온다', async () => {
    // visitorPass만 조건이 OR다 (방문증 또는 로비폰)
    const result = await renderLayout({ contentList: ['로비폰'] })

    expect(toIdRows(result.current.layoutRows)).toEqual([['visitorPass']])
  })
})
