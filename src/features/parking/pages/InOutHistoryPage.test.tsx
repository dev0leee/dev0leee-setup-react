import { http, HttpResponse } from 'msw'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { InOutHistoryPage } from '@/features/parking/pages/InOutHistoryPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const IN_OUT_LIST_PATH = `${API_PREFIX.PARKING}/inout-parking/${RESIDENT_UUID}`

/** `useReturnFromDetail`이 쓰는 저장 키. 목록마다 다르다 */
const FORWARD_STORAGE_KEY = 'parkingListForward:inOutCarList'

const IN_OUT_CAR = {
  uuid: 'inout-1',
  carNum: '12가3456',
  carType: 'REGULAR',
  inParkingTime: '2026-07-29 10:00:00',
  outParkingTime: '2026-07-29 12:30:00',
  parkingMinutes: 150,
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

/** 뒤로가기(`POP`)를 일으킬 수 있는 목적지. 상세·등록 둘 다로 쓴다 */
const BackProbe = ({ title }: { title: string }) => {
  const navigate = useNavigate()

  return (
    <>
      <h1>{title}</h1>
      <button
        type="button"
        onClick={() => {
          void navigate(-1)
        }}
      >
        뒤로
      </button>
    </>
  )
}

const renderListPage = () => {
  return renderWithProviders({
    initialEntries: [ROUTE_PATH.PARKING_INOUT_HISTORY],
    ui: (
      <Routes>
        <Route path={ROUTE_PATH.PARKING_INOUT_HISTORY} element={<InOutHistoryPage />} />
        <Route
          path={ROUTE_PATH.PARKING_INOUT_HISTORY_DETAIL}
          element={<BackProbe title="상세 화면" />}
        />
        <Route
          path="/parking/carManagement/bookmark/add"
          element={<BackProbe title="등록 화면" />}
        />
      </Routes>
    ),
  })
}

describe('InOutHistoryPage (PK8)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })

    server.use(
      http.get(url({ path: IN_OUT_LIST_PATH }), () => {
        return HttpResponse.json(page({ content: [IN_OUT_CAR] }))
      }),
    )
  })

  it('차량 유형 칩과 3개 필드를 보여준다', async () => {
    renderListPage()

    const card = (await screen.findByText('12가3456')).closest('li')
    expect(card).toHaveTextContent('정기차량')
    expect(card).toHaveTextContent('입차시간2026-07-29 10:00:00')
    expect(card).toHaveTextContent('총 주차시간2시간 30분')
  })

  it('0분은 `0분`으로 쓴다 — 상세(PK9)는 같은 값을 `-`로 쓴다', async () => {
    server.use(
      http.get(url({ path: IN_OUT_LIST_PATH }), () => {
        return HttpResponse.json(page({ content: [{ ...IN_OUT_CAR, parkingMinutes: 0 }] }))
      }),
    )

    renderListPage()

    const card = (await screen.findByText('12가3456')).closest('li')
    expect(card).toHaveTextContent('총 주차시간0분')
  })

  it('표에 없는 차량 유형이면 칩이 글자·색 없이 렌더된다 (레거시 동일)', async () => {
    server.use(
      http.get(url({ path: IN_OUT_LIST_PATH }), () => {
        return HttpResponse.json(page({ content: [{ ...IN_OUT_CAR, carType: 'NEW_TYPE' }] }))
      }),
    )

    renderListPage()

    await screen.findByText('12가3456')
    expect(screen.queryByText('정기차량')).not.toBeInTheDocument()
  })

  it('카드를 누르면 상세로 간다', async () => {
    renderListPage()

    await userEvent.click(await screen.findByText('12가3456'))

    expect(await screen.findByRole('heading', { name: '상세 화면' })).toBeInTheDocument()
  })

  it('처음에는 이번 달로 조회한다', async () => {
    let requestUrl = ''
    server.use(
      http.get(url({ path: IN_OUT_LIST_PATH }), ({ request }) => {
        requestUrl = request.url
        return HttpResponse.json(page({ content: [IN_OUT_CAR] }))
      }),
    )

    renderListPage()
    await screen.findByText('12가3456')

    const now = new Date()
    const expectedStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01 00:00:00`

    const params = new URL(requestUrl).searchParams
    expect(params.get('startDate')).toBe(expectedStart)
    // 마일리지 목록과 달리 정렬이 실제로 전달된다
    expect(params.get('desc')).toBe('true')
  })

  it('월을 바꾸면 그 달로 다시 조회하고, 선택한 달이 화면에 남는다', async () => {
    const startDates: (string | null)[] = []
    server.use(
      http.get(url({ path: IN_OUT_LIST_PATH }), ({ request }) => {
        startDates.push(new URL(request.url).searchParams.get('startDate'))
        return HttpResponse.json(page({ content: [IN_OUT_CAR] }))
      }),
    )

    renderListPage()
    await screen.findByText('12가3456')

    const now = new Date()
    await userEvent.click(screen.getByText(`${now.getFullYear()}년 ${now.getMonth() + 1}월분`))

    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    await userEvent.click(
      await screen.findByText(`${previous.getFullYear()}년 ${previous.getMonth() + 1}월`),
    )

    const expectedStart = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}-01 00:00:00`

    expect(
      await screen.findByText(`${previous.getFullYear()}년 ${previous.getMonth() + 1}월분`),
    ).toBeInTheDocument()
    expect(startDates.at(-1)).toBe(expectedStart)
  })

  it('🔴 상세를 다녀오면 목록을 다시 조회하지 않는다 (PK-Q2 A안)', async () => {
    let requestCount = 0
    server.use(
      http.get(url({ path: IN_OUT_LIST_PATH }), () => {
        requestCount += 1
        return HttpResponse.json(page({ content: [IN_OUT_CAR] }))
      }),
    )

    renderListPage()
    await screen.findByText('12가3456')
    expect(requestCount).toBe(1)

    await userEvent.click(screen.getByText('12가3456'))
    await screen.findByRole('heading', { name: '상세 화면' })

    await userEvent.click(screen.getByRole('button', { name: '뒤로' }))
    await screen.findByText('12가3456')

    // 캐시를 비우지 않고 `staleTime: Infinity`도 걸리므로 요청이 늘지 않는다
    expect(requestCount).toBe(1)
  })

  it('복귀 표시는 **상세로 나갈 때만** 남는다', async () => {
    const { unmount } = renderListPage()
    await screen.findByText('12가3456')

    // 목록에 머무는 동안에는 표시가 없다
    expect(sessionStorage.getItem(FORWARD_STORAGE_KEY)).toBeNull()

    await userEvent.click(screen.getByText('12가3456'))
    await screen.findByRole('heading', { name: '상세 화면' })

    expect(sessionStorage.getItem(FORWARD_STORAGE_KEY)).toBe('detail')
    unmount()
  })

  it('상세를 거치지 않고 화면을 떠나면 표시가 남지 않는다', async () => {
    const { unmount } = renderListPage()
    await screen.findByText('12가3456')

    unmount()

    expect(sessionStorage.getItem(FORWARD_STORAGE_KEY)).toBeNull()
  })

  it('0건이면 빈 문구, 실패하면 안내 2줄', async () => {
    server.use(
      http.get(url({ path: IN_OUT_LIST_PATH }), () => {
        return HttpResponse.json(page({ content: [] }))
      }),
    )

    const { unmount } = renderListPage()
    expect(await screen.findByText('입출차 내역이 없습니다')).toBeInTheDocument()
    unmount()

    server.use(
      http.get(url({ path: IN_OUT_LIST_PATH }), () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderListPage()
    expect(await screen.findByText(/입출차 내역을 불러올 수 없습니다/)).toBeInTheDocument()
  })
})
