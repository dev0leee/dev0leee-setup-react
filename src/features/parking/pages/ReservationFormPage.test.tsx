import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ReservationFormPage } from '@/features/parking/pages/ReservationFormPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { fireEvent, renderWithProviders, screen, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const APT_UUID = 'apt-uuid-1'
const RESERVATION_UUID = 'reservation-1'

const VISIT_PURPOSE_PATH = `${API_PREFIX.PARKING}/visit-purpose/${APT_UUID}`
const DETAIL_PATH = `${API_PREFIX.PARKING}/reservation/${RESIDENT_UUID}/${RESERVATION_UUID}`
const POST_PATH = `${API_PREFIX.PARKING}/reservation/${RESIDENT_UUID}`
const BOOKMARK_PATH = `${API_PREFIX.PARKING}/${RESIDENT_UUID}/bookmark`
const RESIDENT_DETAIL_PATH = `${API_PREFIX.APARTMANT}/apt-resident/:uuid`

const VISIT_PURPOSE = { uuid: 'purpose-1', name: '택배' }

/** 자정 근처를 골라 타임존 보정이 빠졌을 때 날짜가 밀리는지 드러나게 한다 */
const TODAY = new Date(2026, 6, 10, 23, 30, 0)

const DETAIL = {
  uuid: RESERVATION_UUID,
  carNum: '12가3456',
  phone: '01012345678',
  visitPurpose: '택배',
  memo: '문앞에 두세요',
  notificationFlag: true,
}

const renderFormPage = ({ path }: { path: string }) => {
  return renderWithProviders({
    initialEntries: [path],
    ui: (
      <Routes>
        <Route path={ROUTE_PATH.PARKING_RESERVATION_ADD} element={<ReservationFormPage />} />
        <Route path={ROUTE_PATH.PARKING_RESERVATION_AGAIN} element={<ReservationFormPage />} />
      </Routes>
    ),
  })
}

/** 달력 드로어를 열어 날짜 하나를 고르고 적용한다 */
const pickSingleDay = (label: string) => {
  const trigger = screen.getByText('예약 기간을 선택해주세요').closest('button')
  fireEvent.click(trigger as HTMLElement)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }))
  fireEvent.click(screen.getByRole('button', { name: '적용하기' }))
}

describe('ReservationFormPage (PK12·PK13)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID, aptUuid: APT_UUID } })
    useErrorModalStore.setState({ current: null })

    // `Date`만 고정한다. 타이머까지 가짜로 만들면 `waitFor`·MSW가 멈춘다
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(TODAY)

    server.use(
      http.get(url({ path: RESIDENT_DETAIL_PATH }), () => {
        return HttpResponse.json({
          success: { ...MOCK_RESIDENT_DETAIL_INFO, contentList: [{ name: '차량세대통보' }] },
        })
      }),
      http.get(url({ path: VISIT_PURPOSE_PATH }), () => {
        return HttpResponse.json({ success: [VISIT_PURPOSE] })
      }),
      http.get(url({ path: BOOKMARK_PATH }), () => {
        return HttpResponse.json({
          success: {
            content: [],
            number: 0,
            totalPages: 1,
            totalElements: 0,
            last: true,
            empty: true,
            numberOfElements: 0,
          },
        })
      }),
      http.get(url({ path: DETAIL_PATH }), () => {
        return HttpResponse.json({ success: DETAIL })
      }),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('등록 화면은 빈 폼이다', async () => {
    renderFormPage({ path: ROUTE_PATH.PARKING_RESERVATION_ADD })

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/차량번호 예\)/)).toBeInTheDocument()
    })
    expect((screen.getByPlaceholderText(/차량번호 예\)/) as HTMLInputElement).value).toBe('')
    expect(screen.getByText('예약 기간을 선택해주세요')).toBeInTheDocument()
  })

  it('재등록 화면은 기존 예약으로 채워지되 **예약 기간은 비어 있다**', async () => {
    renderFormPage({ path: `/parking/reservation/add/${RESERVATION_UUID}` })

    await waitFor(() => {
      expect(screen.getByDisplayValue('12가3456')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('010-1234-5678')).toBeInTheDocument()
    expect(screen.getByDisplayValue('택배')).toBeInTheDocument()
    expect(screen.getByDisplayValue('문앞에 두세요')).toBeInTheDocument()
    // 날짜는 매번 새로 고른다
    expect(screen.getByText('예약 기간을 선택해주세요')).toBeInTheDocument()
  })

  it('🔴 삭제된 방문목적이 걸린 예약도 화면이 깨지지 않는다 (레거시는 터진다)', async () => {
    server.use(
      http.get(url({ path: DETAIL_PATH }), () => {
        return HttpResponse.json({ success: { ...DETAIL, visitPurpose: '사라진목적' } })
      }),
    )

    renderFormPage({ path: `/parking/reservation/add/${RESERVATION_UUID}` })

    await waitFor(() => {
      expect(screen.getByDisplayValue('12가3456')).toBeInTheDocument()
    })
    // 방문목적만 비어 있고 나머지는 채워진다
    expect(screen.getByPlaceholderText('방문 목적을 선택하세요')).toHaveValue('')
  })

  it('기간을 고르지 않고 제출하면 **인라인 에러**로 막힌다 (모달이 아니다)', async () => {
    // 제출 직전 사전 검증(모달)은 스키마를 통과한 뒤에야 돈다 — 빈 값은 스키마가 먼저 잡는다
    renderFormPage({ path: ROUTE_PATH.PARKING_RESERVATION_ADD })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '등록하기' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }))

    expect(await screen.findByText('기간을 선택해주세요')).toBeInTheDocument()
    expect(useErrorModalStore.getState().current).toBeNull()
  })

  it('🔴 자정 직전에 예약해도 날짜가 밀리지 않는다 (타임존 보정)', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(url({ path: POST_PATH }), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderFormPage({ path: `/parking/reservation/add/${RESERVATION_UUID}` })

    await waitFor(() => {
      expect(screen.getByDisplayValue('12가3456')).toBeInTheDocument()
    })

    pickSingleDay('2026년 7월 10일')
    fireEvent.click(screen.getByLabelText('예'))
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }))

    await waitFor(() => {
      expect(body.carNum).toBe('12가3456')
    })

    // 보정이 없으면 UTC로 밀려 `2026-07-09`가 된다
    expect(body.inParkingScheduledDate).toBe('2026-07-10 00:00:00')
    expect(body.outParkingScheduledDate).toBe('2026-07-10 23:59:59')
    expect(body.phone).toBe('01012345678')
    expect(body.visitPurposeUuid).toBe('purpose-1')
    expect(body.notificationFlag).toBe(true)
  })

  it('중복 예약 에러는 전용 문구로 바뀐다', async () => {
    server.use(
      http.post(url({ path: POST_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'RESERVATION_MILEAGE_LIMIT', message: '서버 원문' } },
          { status: 400 },
        )
      }),
    )

    renderFormPage({ path: `/parking/reservation/add/${RESERVATION_UUID}` })

    await waitFor(() => {
      expect(screen.getByDisplayValue('12가3456')).toBeInTheDocument()
    })

    pickSingleDay('2026년 7월 10일')
    fireEvent.click(screen.getByLabelText('예'))
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }))

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe(
        '마일리지가 모두 소진 되어 예약 할 수 없습니다.',
      )
    })
  })
})
