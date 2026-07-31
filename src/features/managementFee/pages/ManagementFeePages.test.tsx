import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { ManagementFeeDetailPage } from '@/features/managementFee/pages/ManagementFeeDetailPage'
import { ManagementFeeInfoPage } from '@/features/managementFee/pages/ManagementFeeInfoPage'
import { getBillDateRange } from '@/features/managementFee/queries/useManagementFee'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const BASE = `${API_PREFIX.APARTMANT}/${RESIDENT_UUID}/bill`

const BILL = {
  houseHolder: {
    periodStartDate: '2026-07-01',
    periodEndDate: '2026-07-31',
    paymentFlag: 'Y',
    autoTransfer: 'Y',
  },
  imposeAmount: { imposeAmount: 210070 },
  billInfo: {
    beforeDeliveryAmountSum: 215300,
    unpaidAmount: 5000,
    unpaidLatefee: 230,
    afterDeliveryAmountSum: 220000,
  },
  itemDetails: [
    { itemName: '일반관리비', thisMonthAmount: 45000, prevMonthComparedIncreOrDecreAmount: 1200 },
    { itemName: '청소비', thisMonthAmount: 12000, prevMonthComparedIncreOrDecreAmount: -300 },
  ],
  reductions: [{ name: '경로우대', amount: 3000 }],
}

const useEndpoints = ({
  yearMonths = ['2026-06', '2026-07'] as unknown,
  bill = BILL as unknown,
  billStatus = 200,
} = {}) => {
  server.use(
    http.get(url({ path: `${BASE}/impose-yearmonths` }), () => {
      return HttpResponse.json({ success: { imposeYearmonths: yearMonths } })
    }),
    http.get(url({ path: BASE }), () => {
      if (billStatus !== 200) return new HttpResponse(null, { status: billStatus })

      return HttpResponse.json({ success: bill })
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({
    aptInfo: { aptResidentUuid: RESIDENT_UUID, contentList: [{ name: ' 관리비 ' }] },
  })
})

describe('getBillDateRange', () => {
  it('⚠️ **공백 구분 포맷**이고 말일을 정확히 잡는다', () => {
    expect(getBillDateRange({ year: 2026, month: 7 })).toEqual({
      startDateTime: '2026-07-01 00:00:00',
      endDateTime: '2026-07-31 23:59:59',
    })
  })

  it('윤년 2월도 정확하다', () => {
    expect(getBillDateRange({ year: 2028, month: 2 }).endDateTime).toBe('2028-02-29 23:59:59')
  })

  it('월에 zero-pad가 붙는다', () => {
    expect(getBillDateRange({ year: 2026, month: 1 }).startDateTime).toBe('2026-01-01 00:00:00')
  })
})

describe('ManagementFeeDetailPage (MF1)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.MANAGEMENT_FEE_DETAIL],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.MANAGEMENT_FEE_DETAIL} element={<ManagementFeeDetailPage />} />
        </Routes>
      ),
    })
  }

  it('가장 최신 년월이 자동 선택되고 고지서를 보여준다', async () => {
    useEndpoints()

    renderPage()

    expect(await screen.findByText('210,070원')).toBeInTheDocument()
    expect(screen.getByText('2026년 7월분 관리비')).toBeInTheDocument()
    // 종료일에서 연도를 잘라낸다
    expect(screen.getByText('2026.07.01 ~ 07.31')).toBeInTheDocument()
    expect(screen.getByText('납부완료')).toBeInTheDocument()
  })

  it('🔴 **`startDateTIme`(대문자 I) 쿼리 키를 그대로 보낸다** — 서버 계약이다', async () => {
    useEndpoints()

    const params: (string | null)[] = []
    server.use(
      http.get(url({ path: BASE }), ({ request }) => {
        const search = new URL(request.url).searchParams
        params.push(search.get('startDateTIme'), search.get('endDateTIme'))
        return HttpResponse.json({ success: BILL })
      }),
    )

    renderPage()

    await waitFor(() => {
      expect(params).toContain('2026-07-01 00:00:00')
    })
    expect(params).toContain('2026-07-31 23:59:59')
  })

  it('`납기내 금액`을 누르면 3행이 펼쳐진다', async () => {
    useEndpoints()

    renderPage()
    await userEvent.click(await screen.findByText('납기내 금액'))

    expect(screen.getByText('당월부과액')).toBeInTheDocument()
    expect(screen.getByText('미납금')).toBeInTheDocument()
    expect(screen.getByText('미납연체료')).toBeInTheDocument()
  })

  it('⚠️ `납기 후 청구 금액`은 **아코디언 밖**이라 항상 보인다', async () => {
    useEndpoints()

    renderPage()

    expect(await screen.findByText('납기 후 청구 금액')).toBeInTheDocument()
    expect(screen.getByText('220,000원')).toBeInTheDocument()
  })

  it('증감이 양수면 빨간 `▲`, 음수면 파란 `▼`다', async () => {
    useEndpoints()

    renderPage()

    const increase = await screen.findByText('▲ 1,200원')
    expect(increase).toHaveClass('text-alerts-error-text-error')
    expect(screen.getByText('▼ 300원')).toHaveClass('text-blue-s-info-500')
  })

  it('✅ 증감이 **`undefined`면 표시하지 않는다** (MF-Q7)', async () => {
    useEndpoints({
      bill: {
        ...BILL,
        itemDetails: [{ itemName: '일반관리비', thisMonthAmount: 45000 }],
      },
    })

    renderPage()

    // 🔴 레거시는 `!== null`만 봐서 `▲ NaN원`이 보였다
    await screen.findByText('일반관리비')
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
    expect(screen.queryByText(/▲|▼/)).not.toBeInTheDocument()
  })

  it('✅ 자동이체 칩이 **`autoTransfer === "Y"`일 때만** 뜬다 (MF-Q5)', async () => {
    useEndpoints({
      bill: { ...BILL, houseHolder: { ...BILL.houseHolder, paymentFlag: 'N' } },
    })

    renderPage()

    expect(await screen.findByText('미납')).toBeInTheDocument()
    expect(screen.getByText('자동이체')).toBeInTheDocument()
  })

  it('✅ 미납인데 **`autoTransfer` 필드가 없으면 칩이 없다** (MF-Q5)', async () => {
    useEndpoints({
      bill: {
        ...BILL,
        houseHolder: {
          periodStartDate: '2026-07-01',
          periodEndDate: '2026-07-31',
          paymentFlag: 'N',
        },
      },
    })

    renderPage()

    // 🔴 레거시는 `!== 'N'`이라 필드가 없어도 칩이 떴다
    expect(await screen.findByText('미납')).toBeInTheDocument()
    expect(screen.queryByText('자동이체')).not.toBeInTheDocument()
  })

  it('할인내역이 없으면 **섹션 자체가 없다**', async () => {
    useEndpoints({ bill: { ...BILL, reductions: [] } })

    renderPage()

    await screen.findByText('210,070원')
    expect(screen.queryByText('할인내역')).not.toBeInTheDocument()
  })

  it('상세내역이 비면 빈 문구가 뜬다', async () => {
    useEndpoints({ bill: { ...BILL, itemDetails: [] } })

    renderPage()

    expect(await screen.findByText('상세내역이 없습니다.')).toBeInTheDocument()
  })

  it('⚠️ 조회 실패 시 **고정 문구**가 뜨고 재시도 버튼이 없다', async () => {
    useEndpoints({ billStatus: 500 })

    renderPage()

    expect(await screen.findByText(/관리비 정보를 불러오는데 실패했습니다/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /다시/ })).not.toBeInTheDocument()
  })
})

describe('ManagementFeeInfoPage (MF2)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.MANAGEMENT_FEE_INFO],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.MANAGEMENT_FEE_INFO} element={<ManagementFeeInfoPage />} />
          <Route path={ROUTE_PATH.MANAGEMENT_FEE_DETAIL} element={<h1>관리비 상세</h1>} />
        </Routes>
      ),
    })
  }

  it('⚠️ **목업 금액과 `납부 완료`(공백 있음) 칩**을 보여준다', () => {
    renderPage()

    expect(screen.getByText('210,070원')).toBeInTheDocument()
    // MF1은 `납부완료`(공백 없음)다
    expect(screen.getByText('납부 완료')).toBeInTheDocument()
  })

  it('전월 대비 문구가 `77,960원 적게`다', () => {
    renderPage()

    // `12,892원 적게`(에너지)도 있어 금액까지 함께 본다
    expect(screen.getByText(/77,960원\s*적게/)).toBeInTheDocument()
    expect(screen.getByText('나왔어요.')).toBeInTheDocument()
  })

  it('⚠️ 에너지 문구·배너가 **하드코딩 리터럴**이다', () => {
    renderPage()

    expect(screen.getByText('12,892원 적게')).toBeInTheDocument()
    expect(screen.getByText('-21%')).toBeInTheDocument()
  })

  it('`관리비 내역 확인`이 MF1으로 간다', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: '관리비 내역 확인' }))

    expect(await screen.findByRole('heading', { name: '관리비 상세' })).toBeInTheDocument()
  })
})
