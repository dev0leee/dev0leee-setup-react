import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { ParkingManagementPage } from '@/features/parking/pages/ParkingManagementPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'

const RESIDENT_DETAIL_PATH = `${API_PREFIX.APARTMANT}/apt-resident/:uuid`
const REMAINING_MILEAGE_PATH = `${API_PREFIX.PARKING}/${RESIDENT_UUID}/mileage`
const REGULAR_CAR_PATH = `${API_PREFIX.PARKING}/${RESIDENT_UUID}/regular/household`
const PARKING_POLICY_PATH = `${API_PREFIX.PARKING}/${RESIDENT_UUID}/parking-policy`

const emptyPage = {
  success: {
    content: [],
    number: 0,
    totalPages: 1,
    totalElements: 0,
    last: true,
    empty: true,
    numberOfElements: 0,
  },
}

const useContentList = (contentList: { name: string }[]) => {
  server.use(
    http.get(url({ path: RESIDENT_DETAIL_PATH }), () => {
      return HttpResponse.json({
        success: { ...MOCK_RESIDENT_DETAIL_INFO, contentList, aptCreatedDate: '2020-01-01' },
      })
    }),
  )
}

/** PK1은 라우트 경로를 봐야 정기권 목록이 임베드 모습이 된다 */
const renderParkingPage = () => {
  return renderWithProviders({
    initialEntries: [ROUTE_PATH.PARKING],
    ui: (
      <Routes>
        <Route path={ROUTE_PATH.PARKING} element={<ParkingManagementPage />} />
        <Route path={ROUTE_PATH.PARKING_MILEAGE_HISTORY} element={<h1>마일리지 내역</h1>} />
        <Route path={ROUTE_PATH.PARKING_INOUT_HISTORY} element={<h1>입출차 내역 화면</h1>} />
      </Routes>
    ),
  })
}

describe('ParkingManagementPage (PK1)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })

    useContentList([{ name: '주차' }])

    server.use(
      http.get(url({ path: REMAINING_MILEAGE_PATH }), () => {
        // 750분 잔여 · 180분 사용 → 총 930분(15시간 30분)
        return HttpResponse.json({ success: { useMileage: 180, remainingMileage: 750 } })
      }),
      http.get(url({ path: REGULAR_CAR_PATH }), () => {
        return HttpResponse.json(emptyPage)
      }),
      http.get(url({ path: PARKING_POLICY_PATH }), () => {
        return HttpResponse.json({
          success: {
            mileagePolicy: { monthBaseMileage: 930, minuteAmount: 50 },
            freeParkingMinute: 30,
            freeParkingStartTime: '09:00:00',
            freeParkingEndTime: '18:00:00',
          },
        })
      }),
    )
  })

  it('잔여 마일리지와 사용량·총량을 시/분으로 보여준다', async () => {
    renderParkingPage()

    expect(await screen.findByText(/12시간/)).toBeInTheDocument()
    expect(screen.getByText(/3시간/)).toBeInTheDocument()
    expect(screen.getByText(/총 15시간 30분/)).toBeInTheDocument()
  })

  it('잔여 마일리지 제목을 누르면 마일리지 내역으로 간다', async () => {
    renderParkingPage()

    await userEvent.click(await screen.findByRole('button', { name: /잔여 주차 마일리지/ }))

    expect(await screen.findByRole('heading', { name: '마일리지 내역' })).toBeInTheDocument()
  })

  it('마일리지 조회에 실패하면 안내 2줄만 남고 진행바가 사라진다', async () => {
    server.use(
      http.get(url({ path: REMAINING_MILEAGE_PATH }), () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    const { container } = renderParkingPage()

    expect(await screen.findByText(/주차 마일리지를 불러올 수 없습니다/)).toBeInTheDocument()
    expect(container.querySelector('progress')).toBeNull()
  })

  it('일반 단지에는 메뉴 4개가 모두 보인다', async () => {
    renderParkingPage()

    expect(await screen.findByText('주차 방문예약')).toBeInTheDocument()
    expect(screen.getByText('입출차 내역')).toBeInTheDocument()
    expect(screen.getByText('즐겨찾기 차량')).toBeInTheDocument()
    expect(screen.getByText('항상허용 차량')).toBeInTheDocument()
  })

  it('마일리지 한도 제한 단지에서는 `항상허용 차량`이 사라진다', async () => {
    useContentList([{ name: '주차' }, { name: '마일리지 한도 제한' }])

    renderParkingPage()

    expect(await screen.findByText('주차 방문예약')).toBeInTheDocument()
    expect(screen.getByText('입출차 내역')).toBeInTheDocument()
    expect(screen.getByText('즐겨찾기 차량')).toBeInTheDocument()
    expect(screen.queryByText('항상허용 차량')).not.toBeInTheDocument()
  })

  it('마일리지 한도 제한 단지에서는 방문예약 타일이 세로 2칸을 차지한다', async () => {
    useContentList([{ name: '주차' }, { name: '마일리지 한도 제한' }])

    renderParkingPage()

    const reservationTile = (await screen.findByText('주차 방문예약')).closest('button')
    expect(reservationTile).toHaveClass('row-span-2')

    const inOutTile = screen.getByText('입출차 내역').closest('button')
    expect(inOutTile).not.toHaveClass('row-span-2')
  })

  it('메뉴를 누르면 해당 경로로 간다', async () => {
    renderParkingPage()

    await userEvent.click(await screen.findByText('입출차 내역'))

    expect(await screen.findByRole('heading', { name: '입출차 내역 화면' })).toBeInTheDocument()
  })

  it('주차 정책 드로어는 열기 전에는 조회하지 않는다', async () => {
    let requestCount = 0
    server.use(
      http.get(url({ path: PARKING_POLICY_PATH }), () => {
        requestCount += 1
        return HttpResponse.json({ success: {} })
      }),
    )

    renderParkingPage()
    await screen.findByText('주차 방문예약')

    expect(requestCount).toBe(0)

    await userEvent.click(screen.getByRole('button', { name: '아파트 주차 정책' }))
    expect(await screen.findByText('우리 아파트 주차 정책')).toBeInTheDocument()
    expect(requestCount).toBe(1)
  })

  it('주차 정책 4개 필드를 형식에 맞춰 보여준다', async () => {
    renderParkingPage()
    await screen.findByText('주차 방문예약')

    await userEvent.click(screen.getByRole('button', { name: '아파트 주차 정책' }))

    // 930분 → `15시간 30분/월`
    expect(await screen.findByText('15시간 30분/월')).toBeInTheDocument()
    expect(screen.getByText('30분')).toBeInTheDocument()
    expect(screen.getByText('매일 09:00 ~ 18:00')).toBeInTheDocument()
    expect(screen.getByText('50원/분')).toBeInTheDocument()
  })

  it('시작=종료면 무료 시간대를 쓰지 않는 단지로 보고 `무료 시간 없음`을 쓴다', async () => {
    server.use(
      http.get(url({ path: PARKING_POLICY_PATH }), () => {
        return HttpResponse.json({
          success: {
            mileagePolicy: { monthBaseMileage: 0, minuteAmount: 0 },
            freeParkingMinute: 0,
            freeParkingStartTime: '00:00:00',
            freeParkingEndTime: '00:00:00',
          },
        })
      }),
    )

    renderParkingPage()
    await screen.findByText('주차 방문예약')
    await userEvent.click(screen.getByRole('button', { name: '아파트 주차 정책' }))

    expect(await screen.findByText('무료 시간 없음')).toBeInTheDocument()
    // 0분은 `0분/월`이다
    expect(screen.getByText('0분/월')).toBeInTheDocument()
  })

  it('요일별 설정이 있으면 무료 주차 시간이 월~일 순서 목록으로 바뀐다', async () => {
    server.use(
      http.get(url({ path: PARKING_POLICY_PATH }), () => {
        return HttpResponse.json({
          success: {
            mileagePolicy: { monthBaseMileage: 60, minuteAmount: 50 },
            freeParkingMinute: 30,
            freeParkingStartTime: '09:00:00',
            freeParkingEndTime: '18:00:00',
            // 응답 순서를 일부러 뒤섞는다 — 화면은 월~일로 다시 세워야 한다
            dayFreeTimeList: [
              { dayOfWeek: 'SUNDAY', freeType: 'ALL_DAY' },
              { dayOfWeek: 'MONDAY', freeType: 'NONE' },
              {
                dayOfWeek: 'WEDNESDAY',
                freeType: 'TIME_RANGE',
                freeParkingStartTime: '10:00:00',
                freeParkingEndTime: '14:00:00',
              },
            ],
          },
        })
      }),
    )

    renderParkingPage()
    await screen.findByText('주차 방문예약')
    await userEvent.click(screen.getByRole('button', { name: '아파트 주차 정책' }))

    const dayRow = await screen.findByText('월')
    const dayList = dayRow.closest('ul')
    expect(dayList).not.toBeNull()

    // 응답에 없는 요일은 빠지고, 남은 것은 월 → 수 → 일 순서다
    const labels = Array.from(dayList?.querySelectorAll('li') ?? []).map((item) => {
      return item.textContent
    })
    expect(labels).toEqual(['월무료 시간 없음', '수10:00 ~ 14:00', '일종일 무료'])

    // 단일 시간대 표시는 사라진다
    expect(screen.queryByText('매일 09:00 ~ 18:00')).not.toBeInTheDocument()
  })

  it('주차 정책 조회에 실패하면 드로어 안에서 안내를 보여준다', async () => {
    server.use(
      http.get(url({ path: PARKING_POLICY_PATH }), () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderParkingPage()
    await screen.findByText('주차 방문예약')
    await userEvent.click(screen.getByRole('button', { name: '아파트 주차 정책' }))

    expect(await screen.findByText(/정보를 불러올 수 없습니다/)).toBeInTheDocument()
  })

  it('하단에 정기권 차량 목록이 제목과 함께 임베드된다', async () => {
    renderParkingPage()

    expect(await screen.findByText('정기권 차량 등록 현황')).toBeInTheDocument()
    expect(await screen.findByText('등록된 정기차량이 없습니다')).toBeInTheDocument()
  })
})
