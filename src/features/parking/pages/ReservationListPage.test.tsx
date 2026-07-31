import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { ReservationListPage } from '@/features/parking/pages/ReservationListPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const LIST_PATH = `${API_PREFIX.PARKING}/reservation/${RESIDENT_UUID}/list`
const RESIDENT_DETAIL_PATH = `${API_PREFIX.APARTMANT}/apt-resident/:uuid`

const RESERVATION = {
  uuid: 'reservation-1',
  carNum: '12가3456',
  inParkingScheduledDate: '2099-07-29',
  outParkingScheduledDate: '2099-07-31',
  inParkingFlag: false,
  notificationFlag: true,
}

const page = ({ content }: { content: unknown[] }) => {
  return {
    success: {
      content,
      number: 0,
      totalPages: 1,
      totalElements: content.length,
      last: true,
      empty: content.length === 0,
      numberOfElements: content.length,
    },
  }
}

const useContentList = (contentList: { name: string }[]) => {
  server.use(
    http.get(url({ path: RESIDENT_DETAIL_PATH }), () => {
      return HttpResponse.json({ success: { ...MOCK_RESIDENT_DETAIL_INFO, contentList } })
    }),
  )
}

const renderListPage = () => {
  return renderWithProviders({
    initialEntries: [ROUTE_PATH.PARKING_RESERVATION],
    ui: (
      <Routes>
        <Route path={ROUTE_PATH.PARKING_RESERVATION} element={<ReservationListPage />} />
        <Route path={ROUTE_PATH.PARKING_RESERVATION_DETAIL} element={<h1>예약 상세</h1>} />
        <Route path={ROUTE_PATH.PARKING_RESERVATION_AGAIN} element={<h1>재등록 화면</h1>} />
        <Route path={ROUTE_PATH.PARKING_RESERVATION_ADD} element={<h1>등록 화면</h1>} />
      </Routes>
    ),
  })
}

describe('ReservationListPage (PK11)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })

    server.use(
      http.get(url({ path: LIST_PATH }), () => {
        return HttpResponse.json(page({ content: [RESERVATION] }))
      }),
    )
  })

  it('총 건수와 예약 기간을 보여준다', async () => {
    renderListPage()

    expect(await screen.findByText('총 1건')).toBeInTheDocument()
    // `.slice(5)`로 연도를 뗀 표기다
    expect(screen.getByText('07/29 ~ 07/31')).toBeInTheDocument()
  })

  it('예약 기간이 하루면 시작일만 보여준다', async () => {
    server.use(
      http.get(url({ path: LIST_PATH }), () => {
        return HttpResponse.json(
          page({
            content: [
              {
                ...RESERVATION,
                inParkingScheduledDate: '2099-07-29',
                outParkingScheduledDate: '2099-07-29',
              },
            ],
          }),
        )
      }),
    )

    renderListPage()

    expect(await screen.findByText('07/29')).toBeInTheDocument()
  })

  it('아직 입차하지 않은 미래 예약은 `입차예정`이다', async () => {
    renderListPage()

    expect(await screen.findByText('입차예정')).toBeInTheDocument()
  })

  it('이미 입차했으면 `입차`다', async () => {
    server.use(
      http.get(url({ path: LIST_PATH }), () => {
        return HttpResponse.json(page({ content: [{ ...RESERVATION, inParkingFlag: true }] }))
      }),
    )

    renderListPage()

    expect(await screen.findByText('입차')).toBeInTheDocument()
  })

  it('출차 예정일이 지났는데 입차 기록이 없으면 `미입차`다', async () => {
    server.use(
      http.get(url({ path: LIST_PATH }), () => {
        return HttpResponse.json(
          page({
            content: [
              {
                ...RESERVATION,
                inParkingScheduledDate: '2020-01-01',
                outParkingScheduledDate: '2020-01-02',
              },
            ],
          }),
        )
      }),
    )

    renderListPage()

    expect(await screen.findByText('미입차')).toBeInTheDocument()
  })

  it('월패드 구독 단지에서만 월패드 칩이 붙는다', async () => {
    useContentList([{ name: '차량세대통보' }])

    renderListPage()

    expect(await screen.findByText('월패드 알림')).toBeInTheDocument()
  })

  it('카드를 누르면 상세로 간다', async () => {
    renderListPage()

    await userEvent.click(await screen.findByText('12가3456'))

    expect(await screen.findByRole('heading', { name: '예약 상세' })).toBeInTheDocument()
  })

  it('🔴 재신청 버튼을 눌러도 **카드 클릭으로 전파되지 않는다**', async () => {
    renderListPage()

    await userEvent.click(await screen.findByText('방문예약 재신청하기'))

    // 상세가 아니라 재등록 화면으로 가야 한다
    expect(await screen.findByRole('heading', { name: '재등록 화면' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '예약 상세' })).not.toBeInTheDocument()
  })

  it('`예약하기`는 등록 화면으로 간다', async () => {
    renderListPage()

    await screen.findByText('12가3456')
    await userEvent.click(screen.getByRole('button', { name: '예약하기' }))

    expect(await screen.findByRole('heading', { name: '등록 화면' })).toBeInTheDocument()
  })

  it('0건이면 빈 문구를 보여준다', async () => {
    server.use(
      http.get(url({ path: LIST_PATH }), () => {
        return HttpResponse.json(page({ content: [] }))
      }),
    )

    renderListPage()

    expect(await screen.findByText('예약 내역이 없습니다')).toBeInTheDocument()
  })
})
