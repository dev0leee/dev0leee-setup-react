import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { RegularCarListPage } from '@/features/parking/pages/RegularCarListPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'

const REGULAR_CAR_PATH = `${API_PREFIX.PARKING}/${RESIDENT_UUID}/regular/household`
const RESIDENT_DETAIL_PATH = `${API_PREFIX.APARTMANT}/apt-resident/:uuid`

const REGULAR_CAR = {
  uuid: 'regular-1',
  carNum: '12가3456',
  name: '홍길동',
  phone: '01012345678',
  notificationFlag: true,
}

const regularCarPage = ({ content }: { content: unknown[] }) => {
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

describe('RegularCarListPage (PK15)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })

    server.use(
      http.get(url({ path: REGULAR_CAR_PATH }), () => {
        return HttpResponse.json(regularCarPage({ content: [REGULAR_CAR] }))
      }),
    )
  })

  it('라우트로 들어오면 제목 없이 목록만 보여준다', async () => {
    renderWithProviders({
      ui: <RegularCarListPage />,
      initialEntries: [ROUTE_PATH.PARKING_REGULAR_CAR],
    })

    expect(await screen.findByText('12가3456')).toBeInTheDocument()
    expect(screen.queryByText('정기권 차량 등록 현황')).not.toBeInTheDocument()
  })

  it('PK1에 임베드되면 제목이 붙는다 — 경로로 구분한다', async () => {
    renderWithProviders({
      ui: <RegularCarListPage />,
      initialEntries: [ROUTE_PATH.PARKING],
    })

    expect(await screen.findByText('정기권 차량 등록 현황')).toBeInTheDocument()
  })

  it('연락처에만 하이픈을 넣고 나머지는 서버 값 그대로 쓴다', async () => {
    renderWithProviders({
      ui: <RegularCarListPage />,
      initialEntries: [ROUTE_PATH.PARKING_REGULAR_CAR],
    })

    const card = (await screen.findByText('12가3456')).closest('li')
    expect(card).toHaveTextContent('차주 이름홍길동')
    expect(card).toHaveTextContent('연락처010-1234-5678')
  })

  it('값이 없는 필드는 `-`가 된다', async () => {
    server.use(
      http.get(url({ path: REGULAR_CAR_PATH }), () => {
        return HttpResponse.json(
          regularCarPage({ content: [{ uuid: 'regular-2', carNum: '99하9999' }] }),
        )
      }),
    )

    renderWithProviders({
      ui: <RegularCarListPage />,
      initialEntries: [ROUTE_PATH.PARKING_REGULAR_CAR],
    })

    const card = (await screen.findByText('99하9999')).closest('li')
    expect(card).toHaveTextContent('차주 이름-')
    expect(card).toHaveTextContent('연락처-')
  })

  it('`차량세대통보` 단지에서는 월패드 칩이 보인다', async () => {
    useContentList([{ name: '차량세대통보' }])

    renderWithProviders({
      ui: <RegularCarListPage />,
      initialEntries: [ROUTE_PATH.PARKING_REGULAR_CAR],
    })

    expect(await screen.findByText('월패드 알림')).toBeInTheDocument()
  })

  it('`외부월패드(정기차량)`만 구독한 단지에서도 정기권 목록에는 칩이 보인다', async () => {
    // 🔴 `carType='regular'`를 넘기는 유일한 호출부라서 그렇다
    useContentList([{ name: '외부월패드(정기차량)' }])

    renderWithProviders({
      ui: <RegularCarListPage />,
      initialEntries: [ROUTE_PATH.PARKING_REGULAR_CAR],
    })

    expect(await screen.findByText('월패드 알림')).toBeInTheDocument()
  })

  it('월패드 서비스가 없으면 칩이 없다', async () => {
    useContentList([{ name: '주차' }])

    renderWithProviders({
      ui: <RegularCarListPage />,
      initialEntries: [ROUTE_PATH.PARKING_REGULAR_CAR],
    })

    await screen.findByText('12가3456')
    expect(screen.queryByText('월패드 알림')).not.toBeInTheDocument()
  })

  it('🔴 서비스명에 공백이 섞이면 칩이 사라진다 — 레거시가 `trim()`을 하지 않는다', async () => {
    // 다른 판정(`hasAptContent`)은 전부 trim한다. 여기만 다르다 (PK-Q1)
    useContentList([{ name: ' 차량세대통보 ' }])

    renderWithProviders({
      ui: <RegularCarListPage />,
      initialEntries: [ROUTE_PATH.PARKING_REGULAR_CAR],
    })

    await screen.findByText('12가3456')
    expect(screen.queryByText('월패드 알림')).not.toBeInTheDocument()
  })

  it('0건이면 빈 문구를 보여준다', async () => {
    server.use(
      http.get(url({ path: REGULAR_CAR_PATH }), () => {
        return HttpResponse.json(regularCarPage({ content: [] }))
      }),
    )

    renderWithProviders({
      ui: <RegularCarListPage />,
      initialEntries: [ROUTE_PATH.PARKING_REGULAR_CAR],
    })

    expect(await screen.findByText('등록된 정기차량이 없습니다')).toBeInTheDocument()
  })

  it('조회에 실패하면 2줄짜리 안내를 보여준다', async () => {
    server.use(
      http.get(url({ path: REGULAR_CAR_PATH }), () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderWithProviders({
      ui: <RegularCarListPage />,
      initialEntries: [ROUTE_PATH.PARKING_REGULAR_CAR],
    })

    expect(await screen.findByText(/정기차량 목록을 불러올 수 없습니다/)).toBeInTheDocument()
  })
})
