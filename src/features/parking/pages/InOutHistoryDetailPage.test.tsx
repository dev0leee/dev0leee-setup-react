import { http, HttpResponse } from 'msw'
import { Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { InOutHistoryDetailPage } from '@/features/parking/pages/InOutHistoryDetailPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const PARKING_UUID = 'inout-1'
const DETAIL_PATH = `${API_PREFIX.PARKING}/inout-parking/${RESIDENT_UUID}/${PARKING_UUID}`

const DETAIL = {
  carNum: '12가3456',
  carType: 'UNKNOWN',
  inParkingTime: '2026-07-29 10:00:00',
  outParkingTime: '2026-07-29 12:30:00',
  parkingMinutes: 150,
  phone: '01012345678',
  visitPurpose: '택배',
  rejectFlag: false,
  inParkingImageUrl: '/in.jpg',
  outParkingImageUrl: null,
}

/** 거부 화면으로 넘어간 뒤 라우터 state를 그대로 보여준다 */
const RejectProbe = () => {
  const location = useLocation()
  const state = location.state as { carNum?: string } | null

  return <h1>거부 화면 carNum={state?.carNum ?? '(없음)'}</h1>
}

const renderDetailPage = () => {
  return renderWithProviders({
    initialEntries: [`${ROUTE_PATH.PARKING_INOUT_HISTORY}/detail/${PARKING_UUID}`],
    ui: (
      <Routes>
        <Route
          path={ROUTE_PATH.PARKING_INOUT_HISTORY_DETAIL}
          element={<InOutHistoryDetailPage />}
        />
        <Route path={ROUTE_PATH.PARKING_REJECT} element={<RejectProbe />} />
      </Routes>
    ),
  })
}

const useDetail = (detail: Record<string, unknown>) => {
  server.use(
    http.get(url({ path: DETAIL_PATH }), () => {
      return HttpResponse.json({ success: detail })
    }),
  )
}

describe('InOutHistoryDetailPage (PK9)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
    useDetail(DETAIL)
  })

  it('7개 필드를 순서대로 보여주고 연락처에 하이픈을 넣는다', async () => {
    renderDetailPage()

    await screen.findByText('차량번호')
    const labels = screen.getAllByText(
      /^(차량번호|입차시간|출차시간|총 주차시간|연락처|방문목적|차량유형)$/,
    )
    const labelTexts = labels.map((label) => {
      return label.textContent
    })

    expect(labelTexts).toEqual([
      '차량번호',
      '입차시간',
      '출차시간',
      '총 주차시간',
      '연락처',
      '방문목적',
      '차량유형',
    ])
    expect(screen.getByText('010-1234-5678')).toBeInTheDocument()
    expect(screen.getByText('미등록')).toBeInTheDocument()
  })

  it('🔴 총 주차시간이 0이면 `-`다 — 목록(PK8)은 `0분`으로 쓴다', async () => {
    useDetail({ ...DETAIL, parkingMinutes: 0 })

    renderDetailPage()

    const row = (await screen.findByText('총 주차시간')).closest('li')
    expect(row).toHaveTextContent('총 주차시간-')
  })

  it('이미지가 없는 칸은 `차량 이미지 없음`이 뜬다', async () => {
    renderDetailPage()

    expect(await screen.findByAltText('입차 사진')).toBeInTheDocument()
    expect(screen.queryByAltText('출차 사진')).not.toBeInTheDocument()
    expect(screen.getByText('차량 이미지 없음')).toBeInTheDocument()
  })

  it('미등록·미거부 차량에만 거부 영역이 뜬다', async () => {
    renderDetailPage()

    expect(await screen.findByText('미확인 차량 거부')).toBeInTheDocument()
  })

  it('이미 거부된 차량에는 거부 영역이 없다', async () => {
    useDetail({ ...DETAIL, rejectFlag: true })

    renderDetailPage()

    await screen.findByText('차량번호')
    expect(screen.queryByText('미확인 차량 거부')).not.toBeInTheDocument()
  })

  it('정기차량에는 거부 영역이 없다', async () => {
    useDetail({ ...DETAIL, carType: 'REGULAR' })

    renderDetailPage()

    await screen.findByText('차량번호')
    expect(screen.queryByText('미확인 차량 거부')).not.toBeInTheDocument()
  })

  it('거부 모달을 거쳐 차량번호를 state로 넘기며 거부 화면으로 간다', async () => {
    renderDetailPage()

    await userEvent.click(await screen.findByRole('button', { name: '거부하기' }))

    expect(await screen.findByText('주차를 거부하시겠습니까?')).toBeInTheDocument()
    expect(screen.getByText('거부시, 마일리지 차감이 되지 않습니다.')).toBeInTheDocument()

    // 모달의 확인 버튼(같은 이름의 버튼이 둘이라 마지막 것을 고른다)
    const rejectButtons = screen.getAllByRole('button', { name: '거부하기' })
    await userEvent.click(rejectButtons[rejectButtons.length - 1] as HTMLElement)

    expect(
      await screen.findByRole('heading', { name: '거부 화면 carNum=12가3456' }),
    ).toBeInTheDocument()
  })

  it('조회에 실패하면 안내 2줄을 보여준다', async () => {
    server.use(
      http.get(url({ path: DETAIL_PATH }), () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderDetailPage()

    expect(await screen.findByText(/입출차 상세 정보를 불러올 수 없습니다/)).toBeInTheDocument()
  })
})
