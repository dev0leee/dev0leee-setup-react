import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { AptMallMyOrderDetailPage } from '@/features/aptMall/pages/AptMallMyOrderDetailPage'
import { AptMallMyOrderPage } from '@/features/aptMall/pages/AptMallMyOrderPage'
import { useAptMallFormStore } from '@/features/aptMall/stores/aptMallFormStore'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const ORDER_UUID = 'order-uuid-1'
const MALL_UUID = 'mall-uuid-1'

const BASE = `${API_PREFIX.APARTMANT}/${RESIDENT_UUID}/apt-mall`
const ORDER_LIST_PATH = `${BASE}/order`
const ORDER_DETAIL_PATH = `${BASE}/order/${ORDER_UUID}`
const MENU_PATH = `${BASE}/${MALL_UUID}/menu`
const TIME_PATH = `${BASE}/${MALL_UUID}/order/time`

const ORDER_ITEM = {
  aptMallOrderUuid: ORDER_UUID,
  aptMallName: '주말조식',
  aptMallOrderState: 'RESERVATION' as const,
  aptMallOrderType: 'VISIT' as const,
  orderDateTime: '2026-08-01T08:00:00',
  personCount: 2,
  orderPrice: 12000,
}

const ORDER_DETAIL = {
  ...ORDER_ITEM,
  createdDate: '2026-07-30T14:00:00',
  orderNote: '창가 자리 부탁드립니다',
  aptMallOrderMenuList: [
    { menuName: '조식 A', count: 2, price: 6000 },
    { menuName: '음료', count: 1, price: 2000 },
  ],
}

const page = (content: unknown[]) => {
  return {
    content,
    number: 0,
    totalPages: 1,
    totalElements: content.length,
    last: true,
    empty: content.length === 0,
    numberOfElements: content.length,
  }
}

const useEndpoints = ({
  orders = [ORDER_ITEM] as unknown[],
  detail = ORDER_DETAIL as unknown,
} = {}) => {
  server.use(
    http.get(url({ path: BASE }), () => {
      return HttpResponse.json({ success: [{ aptMallUuid: MALL_UUID, aptMallName: '주말조식' }] })
    }),
    http.get(url({ path: `${BASE}/${MALL_UUID}` }), () => {
      return HttpResponse.json({
        success: {
          aptMallUuid: MALL_UUID,
          reservationLimitDays: 14,
          operatingDayList: ['SATURDAY', 'SUNDAY'],
          orderTimeLimitPersonFlag: true,
        },
      })
    }),
    http.get(url({ path: ORDER_LIST_PATH }), () => {
      return HttpResponse.json({ success: page(orders) })
    }),
    http.get(url({ path: ORDER_DETAIL_PATH }), () => {
      return HttpResponse.json({ success: detail })
    }),
    http.get(url({ path: TIME_PATH }), () => {
      return HttpResponse.json({
        success: [
          {
            aptMallOrderTimeUuid: 'time-1',
            orderTime: '08:00:00',
            limitPersonCount: 10,
            orderPersonCount: 2,
          },
        ],
      })
    }),
    http.get(url({ path: MENU_PATH }), () => {
      return HttpResponse.json({
        success: [
          {
            aptMallMenuUuid: 'menu-1',
            aptMallMenuName: '조식 A',
            price: 6000,
            takeOutPrice: 5000,
            orderMenuCountEqualsOrderPersonCountFlag: true,
          },
          { aptMallMenuUuid: 'menu-2', aptMallMenuName: '음료', price: 2000, takeOutPrice: 2000 },
        ],
      })
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({
    aptInfo: { aptResidentUuid: RESIDENT_UUID, contentList: [{ name: ' 아파트몰 ' }] },
  })
  useErrorModalStore.setState({ current: null })
  useAptMallFormStore.setState({ aptMallFormData: {}, menuInitialized: false })
})

describe('AptMallMyOrderPage (AM2)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.APT_MALL_MY_ORDER],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.APT_MALL_MY_ORDER} element={<AptMallMyOrderPage />} />
          <Route path={ROUTE_PATH.APT_MALL_MY_ORDER_DETAIL} element={<h1>예약 상세</h1>} />
        </Routes>
      ),
    })
  }

  it('총 건수와 카드 3행을 보여준다', async () => {
    useEndpoints()

    renderPage()

    expect(await screen.findByText('총 1건')).toBeInTheDocument()
    expect(screen.getByText('예약완료')).toBeInTheDocument()
    expect(screen.getByText('12,000원')).toBeInTheDocument()
    expect(screen.getByText('방문식사')).toBeInTheDocument()
    expect(screen.getByText('2026-08-01 08:00')).toBeInTheDocument()
    expect(screen.getByText('2명')).toBeInTheDocument()
  })

  it('⚠️ `포장` 예약에도 **`인원 수` 행이 남는다**(값 `-`)', async () => {
    useEndpoints({
      orders: [{ ...ORDER_ITEM, aptMallOrderType: 'TAKEOUT', personCount: undefined }],
    })

    renderPage()

    expect(await screen.findByText('포장')).toBeInTheDocument()
    expect(screen.getByText('인원 수')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('0건이면 빈 문구가 뜬다', async () => {
    useEndpoints({ orders: [] })

    renderPage()

    expect(await screen.findByText('예약 내역이 없습니다')).toBeInTheDocument()
  })

  it('카드를 누르면 상세로 간다', async () => {
    useEndpoints()

    renderPage()
    await userEvent.click(await screen.findByText('12,000원'))

    expect(await screen.findByRole('heading', { name: '예약 상세' })).toBeInTheDocument()
  })

  it('`예약하기`가 위저드 드로어를 연다 (**URL은 그대로다**)', async () => {
    useEndpoints({ orders: [] })

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '예약하기' }))

    expect(await screen.findByText('예약 유형 선택')).toBeInTheDocument()
    expect(screen.getByText('방문식사')).toBeInTheDocument()
    expect(screen.getByText('포장')).toBeInTheDocument()
  })

  it('유형을 고르면 **즉시 다음 단계**로 넘어간다', async () => {
    useEndpoints({ orders: [] })

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '예약하기' }))
    await userEvent.click(screen.getByText('방문식사'))

    expect(await screen.findByText('일자 및 인원 선택')).toBeInTheDocument()
    // 방문식사는 인원 선택이 보인다
    expect(await screen.findByText('1명')).toBeInTheDocument()
  })

  it('⚠️ `포장`은 **인원 선택이 없다**', async () => {
    useEndpoints({ orders: [] })

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '예약하기' }))
    await userEvent.click(screen.getByText('포장'))

    expect(await screen.findByText('일자 및 인원 선택')).toBeInTheDocument()
    expect(screen.queryByText('1명')).not.toBeInTheDocument()
  })
})

describe('AptMallMyOrderDetailPage (AM3)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [`/aptMall/myOrder/detail/${ORDER_UUID}`],
      ui: (
        <Routes>
          <Route
            path={ROUTE_PATH.APT_MALL_MY_ORDER_DETAIL}
            element={<AptMallMyOrderDetailPage />}
          />
        </Routes>
      ),
    })
  }

  it('예약 정보 4필드와 결제금액을 보여준다', async () => {
    useEndpoints()

    renderPage()

    expect(await screen.findByText('2026-07-30 14:00 등록')).toBeInTheDocument()
    expect(screen.getByText('창가 자리 부탁드립니다')).toBeInTheDocument()
    expect(screen.getByText('조식 A x 2')).toBeInTheDocument()
  })

  it('⚠️ **합계가 단가의 단순 합이다** — 수량을 곱하지 않는다 (AM-Q10)', async () => {
    useEndpoints()

    renderPage()

    // 6000 + 2000 = 8000. 수량을 곱하면 14,000이다
    await screen.findByText('조식 A x 2')
    expect(screen.getByText('8,000원')).toBeInTheDocument()
  })

  it('`RESERVATION`이면 `취소하기`가 있고 확인하면 삭제 요청이 나간다', async () => {
    useEndpoints()

    let deleted = false
    server.use(
      http.delete(url({ path: ORDER_DETAIL_PATH }), () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '취소하기' }))

    expect(await screen.findByText('취소하시겠습니까?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '취소' }))

    await waitFor(() => {
      expect(deleted).toBe(true)
    })
  })

  it('`CANCELED`면 취소 정보 섹션과 **비활성 `취소 완료` 버튼**이 나온다', async () => {
    useEndpoints({
      detail: {
        ...ORDER_DETAIL,
        aptMallOrderState: 'CANCELED',
        canceledDateTime: '2026-07-31T09:00:00',
        canceledReason: '개인 사정',
      },
    })

    renderPage()

    expect(await screen.findByText('취소일시')).toBeInTheDocument()
    expect(screen.getByText('개인 사정')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2026-07-31 09:00 취소 완료' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: '취소하기' })).not.toBeInTheDocument()
  })

  it('✅ 표에 **없는 상태**가 와도 화면이 살아 있다 (AM-Q5)', async () => {
    useEndpoints({ detail: { ...ORDER_DETAIL, aptMallOrderState: 'UNKNOWN_STATE' } })

    renderPage()

    // 🔴 레거시는 `findStatus.status`에서 크래시했다
    expect(await screen.findByText('조식 A x 2')).toBeInTheDocument()
    expect(screen.queryByText('취소일시')).not.toBeInTheDocument()
  })
})
