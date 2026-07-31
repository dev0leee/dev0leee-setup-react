import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { MileageHistoryPage } from '@/features/parking/pages/MileageHistoryPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'

const MILEAGE_LIST_PATH = `${API_PREFIX.PARKING}/inout-parking/${RESIDENT_UUID}/mileage`
const REMAINING_MILEAGE_PATH = `${API_PREFIX.PARKING}/${RESIDENT_UUID}/mileage`
const RESIDENT_DETAIL_PATH = `${API_PREFIX.APARTMANT}/apt-resident/:uuid`

/** 카드 2개가 조회되려면 단지 생성일이 조회 시작월보다 앞서야 한다 */
const RESIDENT_DETAIL_WITH_CREATED_DATE = {
  ...MOCK_RESIDENT_DETAIL_INFO,
  aptCreatedDate: '2020-01-01',
}

const mileagePage = ({
  content,
  totalElements = content.length,
}: {
  content: unknown[]
  totalElements?: number
}) => {
  return {
    success: {
      content,
      number: 0,
      totalPages: 1,
      totalElements,
      last: true,
      empty: content.length === 0,
      numberOfElements: content.length,
    },
  }
}

const OUT_CAR = {
  uuid: 'mileage-1',
  carNum: '12가3456',
  inParkingTime: '2026-07-29 10:00:00',
  outParkingTime: '2026-07-29 12:30:00',
  parkingMinutes: 150,
  useMileage: 150,
}

const NOT_OUT_CAR = {
  uuid: 'mileage-2',
  carNum: '34나5678',
  inParkingTime: '2026-07-30 09:00:00',
  outParkingTime: null,
  parkingMinutes: 30,
  useMileage: 0,
}

describe('MileageHistoryPage (PK2)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })

    server.use(
      http.get(url({ path: RESIDENT_DETAIL_PATH }), () => {
        return HttpResponse.json({ success: RESIDENT_DETAIL_WITH_CREATED_DATE })
      }),
      http.get(url({ path: REMAINING_MILEAGE_PATH }), () => {
        return HttpResponse.json({ success: { useMileage: 180, remainingMileage: 750 } })
      }),
      http.get(url({ path: MILEAGE_LIST_PATH }), () => {
        return HttpResponse.json(mileagePage({ content: [OUT_CAR, NOT_OUT_CAR] }))
      }),
    )
  })

  it('총 건수와 마일리지 카드 2개를 보여준다', async () => {
    renderWithProviders({ ui: <MileageHistoryPage /> })

    expect(await screen.findByText('총 2건')).toBeInTheDocument()

    // 750분 = 12시간 30분 · 180분 = 3시간 0분
    expect(await screen.findByText('잔여 주차 마일리지')).toBeInTheDocument()
    expect(screen.getByText('사용한 주차 마일리지')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('출차하지 않은 건에만 `미출차` 칩이 붙고 출차시간이 `-`가 된다', async () => {
    renderWithProviders({ ui: <MileageHistoryPage /> })

    const notOutCard = (await screen.findByText('34나5678')).closest('li')
    expect(notOutCard).not.toBeNull()
    expect(notOutCard).toHaveTextContent('미출차')
    // `outParkingTime`이 null이라 `renderFieldValue`가 아니라 `|| '-'`가 채운다
    expect(notOutCard).toHaveTextContent('출차시간-')

    const outCard = screen.getByText('12가3456').closest('li')
    expect(outCard).not.toHaveTextContent('미출차')
  })

  it('입출차 시간은 서버 문자열을 그대로 출력하고, 분 단위 필드만 시/분으로 바꾼다', async () => {
    renderWithProviders({ ui: <MileageHistoryPage /> })

    const card = (await screen.findByText('12가3456')).closest('li')

    // 가공 없이 그대로 (PK-Q7)
    expect(card).toHaveTextContent('2026-07-29 10:00:00')
    // 150분 → `2시간 30분`. 총 주차시간·사용한 마일리지 둘 다
    expect(card).toHaveTextContent('총 주차시간2시간 30분')
    expect(card).toHaveTextContent('사용한 마일리지2시간 30분')
  })

  it('1시간 미만은 `분`만, 0이면 `0분`으로 쓴다', async () => {
    renderWithProviders({ ui: <MileageHistoryPage /> })

    const card = (await screen.findByText('34나5678')).closest('li')

    expect(card).toHaveTextContent('총 주차시간30분')
    expect(card).toHaveTextContent('사용한 마일리지0분')
  })

  it('0건이면 빈 문구를 보여준다', async () => {
    server.use(
      http.get(url({ path: MILEAGE_LIST_PATH }), () => {
        return HttpResponse.json(mileagePage({ content: [] }))
      }),
    )

    renderWithProviders({ ui: <MileageHistoryPage /> })

    expect(await screen.findByText('마일리지 사용 내역이 없습니다')).toBeInTheDocument()
    expect(screen.getByText('총 0건')).toBeInTheDocument()
  })

  it('조회에 실패하면 2줄짜리 안내를 보여준다', async () => {
    server.use(
      http.get(url({ path: MILEAGE_LIST_PATH }), () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderWithProviders({ ui: <MileageHistoryPage /> })

    expect(await screen.findByText(/마일리지 내역을 불러올 수 없습니다/)).toBeInTheDocument()
    expect(screen.getByText(/잠시 후 다시 시도해주세요/)).toBeInTheDocument()
  })

  it('월 선택 드로어에는 이번 달 포함 최근 3개월만 나온다', async () => {
    renderWithProviders({ ui: <MileageHistoryPage /> })

    await screen.findByText('총 2건')

    const now = new Date()
    const currentLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월분`
    await userEvent.click(screen.getByText(currentLabel))

    // `월분`이 아니라 `월`로 끝나는 항목이 목록이다
    const monthItems = await screen.findAllByText(/^\d{4}년 \d{1,2}월$/)
    expect(monthItems).toHaveLength(3)
  })

  it('월을 바꾸면 그 달의 기간으로 목록과 카드를 다시 조회한다', async () => {
    const listStartDates: (string | null)[] = []
    const cardStartDates: (string | null)[] = []

    server.use(
      http.get(url({ path: MILEAGE_LIST_PATH }), ({ request }) => {
        listStartDates.push(new URL(request.url).searchParams.get('startDate'))
        return HttpResponse.json(mileagePage({ content: [OUT_CAR] }))
      }),
      http.get(url({ path: REMAINING_MILEAGE_PATH }), ({ request }) => {
        cardStartDates.push(new URL(request.url).searchParams.get('startDate'))
        return HttpResponse.json({ success: { useMileage: 0, remainingMileage: 0 } })
      }),
    )

    renderWithProviders({ ui: <MileageHistoryPage /> })
    await screen.findByText('총 1건')

    const now = new Date()
    await userEvent.click(screen.getByText(`${now.getFullYear()}년 ${now.getMonth() + 1}월분`))

    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    await userEvent.click(
      await screen.findByText(`${previous.getFullYear()}년 ${previous.getMonth() + 1}월`),
    )

    const expectedStart = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}-01 00:00:00`

    await screen.findByText(`${previous.getFullYear()}년 ${previous.getMonth() + 1}월분`)

    expect(listStartDates.at(-1)).toBe(expectedStart)
    expect(cardStartDates.at(-1)).toBe(expectedStart)
  })

  it('정렬 파라미터를 서버에 보내지 않는다 — `isLatest`는 API가 받지 않는다', async () => {
    let requestUrl = ''
    server.use(
      http.get(url({ path: MILEAGE_LIST_PATH }), ({ request }) => {
        requestUrl = request.url
        return HttpResponse.json(mileagePage({ content: [OUT_CAR] }))
      }),
    )

    renderWithProviders({ ui: <MileageHistoryPage /> })
    await screen.findByText('총 1건')

    const params = new URL(requestUrl).searchParams
    expect(params.get('isLatest')).toBeNull()
    expect(params.get('isDesc')).toBeNull()
  })
})
