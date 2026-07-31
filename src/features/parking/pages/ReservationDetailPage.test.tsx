import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { ReservationDetailPage } from '@/features/parking/pages/ReservationDetailPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const RESERVATION_UUID = 'reservation-1'
const DETAIL_PATH = `${API_PREFIX.PARKING}/reservation/${RESIDENT_UUID}/${RESERVATION_UUID}`
const RESIDENT_DETAIL_PATH = `${API_PREFIX.APARTMANT}/apt-resident/:uuid`

const DETAIL = {
  uuid: RESERVATION_UUID,
  carNum: '12가3456',
  inParkingScheduledDate: '2099-07-29',
  outParkingScheduledDate: '2099-07-31',
  inParkingFlag: false,
  phone: '01012345678',
  visitPurpose: '택배',
  memo: '문앞에\n두세요',
  notificationFlag: true,
}

const useDetail = (detail: Record<string, unknown>) => {
  server.use(
    http.get(url({ path: DETAIL_PATH }), () => {
      return HttpResponse.json({ success: detail })
    }),
  )
}

const renderDetailPage = () => {
  return renderWithProviders({
    initialEntries: [`/parking/reservation/detail/${RESERVATION_UUID}`],
    ui: (
      <Routes>
        <Route path={ROUTE_PATH.PARKING_RESERVATION_DETAIL} element={<ReservationDetailPage />} />
        <Route path={ROUTE_PATH.PARKING_RESERVATION_AGAIN} element={<h1>재등록 화면</h1>} />
      </Routes>
    ),
  })
}

describe('ReservationDetailPage (PK14)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
    useErrorModalStore.setState({ current: null })

    server.use(
      http.get(url({ path: RESIDENT_DETAIL_PATH }), () => {
        return HttpResponse.json({
          success: { ...MOCK_RESIDENT_DETAIL_INFO, contentList: [{ name: '차량세대통보' }] },
        })
      }),
    )
    useDetail(DETAIL)
  })

  it('6개 필드와 월패드 행을 보여준다', async () => {
    renderDetailPage()

    expect(await screen.findByText('12가3456')).toBeInTheDocument()
    expect(screen.getByText('07/29 ~ 07/31')).toBeInTheDocument()
    expect(screen.getByText('입차예정')).toBeInTheDocument()
    expect(screen.getByText('010-1234-5678')).toBeInTheDocument()
    expect(screen.getByText('택배')).toBeInTheDocument()
    expect(screen.getByText('입출차 시 월패드 알림 여부')).toBeInTheDocument()
    expect(screen.getByText('예')).toBeInTheDocument()
  })

  it('🔴 메모만 줄바꿈이 살아난다 — 다른 필드는 텍스트로 나온다', async () => {
    renderDetailPage()

    const memoLabel = await screen.findByText('메모')
    const memoValue = memoLabel.parentElement?.querySelector('span:last-child')

    expect(memoValue?.querySelector('br')).not.toBeNull()
    expect(memoValue?.textContent).toContain('문앞에')
  })

  it('월패드 미구독 단지에는 월패드 행이 없다', async () => {
    server.use(
      http.get(url({ path: RESIDENT_DETAIL_PATH }), () => {
        return HttpResponse.json({
          success: { ...MOCK_RESIDENT_DETAIL_INFO, contentList: [{ name: '주차' }] },
        })
      }),
    )

    renderDetailPage()

    await screen.findByText('12가3456')
    expect(screen.queryByText('입출차 시 월패드 알림 여부')).not.toBeInTheDocument()
  })

  it('삭제는 확인 모달을 거친다', async () => {
    let deleted = false
    server.use(
      http.delete(url({ path: DETAIL_PATH }), () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderDetailPage()

    await userEvent.click(await screen.findByRole('button', { name: '삭제' }))
    expect(await screen.findByText('차량정보를 삭제하시겠어요?')).toBeInTheDocument()

    // 모달의 확인 버튼(같은 이름이 둘이라 마지막 것)
    const deleteButtons = screen.getAllByRole('button', { name: '삭제' })
    await userEvent.click(deleteButtons[deleteButtons.length - 1] as HTMLElement)

    await waitFor(() => {
      expect(deleted).toBe(true)
    })
  })

  it('✅ 삭제 실패의 `RESERVATION_DATE_INVALID`가 전용 문구로 뜬다 (레거시는 괄호 오타로 못 잡았다)', async () => {
    server.use(
      http.delete(url({ path: DETAIL_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'RESERVATION_DATE_INVALID', message: '서버 원문' } },
          { status: 400 },
        )
      }),
    )

    renderDetailPage()

    await userEvent.click(await screen.findByRole('button', { name: '삭제' }))
    const deleteButtons = await screen.findAllByRole('button', { name: '삭제' })
    await userEvent.click(deleteButtons[deleteButtons.length - 1] as HTMLElement)

    await screen.findByText('12가3456')
    expect(useErrorModalStore.getState().current?.text).toBe(
      '예약일자는 7일 이내로 선택가능합니다.',
    )
  })

  it('하단 재신청 버튼은 재등록 화면으로 간다', async () => {
    renderDetailPage()

    await userEvent.click(await screen.findByText('방문예약 재신청하기'))

    expect(await screen.findByRole('heading', { name: '재등록 화면' })).toBeInTheDocument()
  })

  it('조회에 실패하면 안내 2줄을 보여준다', async () => {
    server.use(
      http.get(url({ path: DETAIL_PATH }), () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderDetailPage()

    expect(await screen.findByText(/예약 상세 정보를 불러올 수 없습니다/)).toBeInTheDocument()
  })
})
