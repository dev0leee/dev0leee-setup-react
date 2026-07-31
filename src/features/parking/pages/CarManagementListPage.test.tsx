import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { beforeEach, describe, expect, it } from 'vitest'

import { CarManagementListPage } from '@/features/parking/pages/CarManagementListPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'

const BOOKMARK_PATH = `${API_PREFIX.PARKING}/${RESIDENT_UUID}/bookmark`
const ALWAYS_ALLOW_PATH = `${API_PREFIX.PARKING}/always-allow/list/${RESIDENT_UUID}`
const RESIDENT_DETAIL_PATH = `${API_PREFIX.APARTMANT}/apt-resident/:uuid`

const BOOKMARK_CAR = {
  uuid: 'bookmark-1',
  carNum: '12가3456',
  nickName: '친구차',
  phone: '01012345678',
}

const ALWAYS_ALLOW_CAR = {
  uuid: 'always-1',
  carNum: '34나5678',
  phone: '01098765432',
  memo: '앞집\n차량',
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

/** 목록 화면은 경로로 즐겨찾기/항상허용을 가른다 */
const renderListPage = (path: string) => {
  return renderWithProviders({
    initialEntries: [path],
    ui: (
      <>
        {/* 토스트는 Toaster가 있어야 렌더된다 */}
        <Toaster />
        <Routes>
          <Route path={ROUTE_PATH.PARKING_CAR_BOOKMARK_LIST} element={<CarManagementListPage />} />
          <Route
            path={ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_LIST}
            element={<CarManagementListPage />}
          />
          <Route path={ROUTE_PATH.PARKING_CAR_BOOKMARK_ADD} element={<h1>즐겨찾기 등록 화면</h1>} />
          <Route
            path={ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_ADD}
            element={<h1>항상허용 등록 화면</h1>}
          />
          <Route
            path={ROUTE_PATH.PARKING_CAR_BOOKMARK_EDIT}
            element={<h1>즐겨찾기 수정 화면</h1>}
          />
        </Routes>
      </>
    ),
  })
}

describe('CarManagementListPage (PK3·PK4)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })

    server.use(
      http.get(url({ path: BOOKMARK_PATH }), () => {
        return HttpResponse.json(page({ content: [BOOKMARK_CAR] }))
      }),
      http.get(url({ path: ALWAYS_ALLOW_PATH }), () => {
        return HttpResponse.json(page({ content: [ALWAYS_ALLOW_CAR] }))
      }),
    )
  })

  it('즐겨찾기는 별칭·연락처를 보여주고 별 아이콘이 붙는다', async () => {
    renderListPage(ROUTE_PATH.PARKING_CAR_BOOKMARK_LIST)

    const card = (await screen.findByText('12가3456')).closest('li')
    expect(card).toHaveTextContent('별칭친구차')
    expect(card).toHaveTextContent('연락처010-1234-5678')
    expect(screen.getByAltText('별 아이콘')).toBeInTheDocument()
  })

  it('항상허용은 연락처·메모를 보여주고 별 아이콘이 없다', async () => {
    renderListPage(ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_LIST)

    const card = (await screen.findByText('34나5678')).closest('li')
    expect(card).toHaveTextContent('연락처010-9876-5432')
    // 메모의 줄바꿈은 공백으로 눌려 한 줄이 된다
    expect(card).toHaveTextContent('메모앞집 차량')
    expect(screen.queryByAltText('별 아이콘')).not.toBeInTheDocument()
  })

  it('항상허용은 월패드 구독 단지에서 칩이 보인다', async () => {
    useContentList([{ name: '차량세대통보' }])

    renderListPage(ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_LIST)

    expect(await screen.findByText('월패드 알림')).toBeInTheDocument()
  })

  it('즐겨찾기 목록에는 월패드 칩이 아예 없다', async () => {
    useContentList([{ name: '차량세대통보' }])

    renderListPage(ROUTE_PATH.PARKING_CAR_BOOKMARK_LIST)

    await screen.findByText('12가3456')
    expect(screen.queryByText('월패드 알림')).not.toBeInTheDocument()
  })

  it('즐겨찾기 카드를 누르면 드로어에 `수정`과 `삭제`가 뜬다', async () => {
    renderListPage(ROUTE_PATH.PARKING_CAR_BOOKMARK_LIST)

    await userEvent.click(await screen.findByText('12가3456'))

    expect(await screen.findByRole('button', { name: '수정' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('⚠️ 항상허용 드로어에는 `수정`이 없다 — 화면도 API도 없기 때문이다', async () => {
    renderListPage(ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_LIST)

    await userEvent.click(await screen.findByText('34나5678'))

    expect(await screen.findByRole('button', { name: '삭제' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()
  })

  it('`수정`은 카드 정보를 라우터 state로 넘기며 수정 화면으로 간다', async () => {
    renderListPage(ROUTE_PATH.PARKING_CAR_BOOKMARK_LIST)

    await userEvent.click(await screen.findByText('12가3456'))
    await userEvent.click(await screen.findByRole('button', { name: '수정' }))

    expect(await screen.findByRole('heading', { name: '즐겨찾기 수정 화면' })).toBeInTheDocument()
  })

  it('삭제는 확인 모달을 거친다', async () => {
    let deletedPath = ''
    server.use(
      http.delete(url({ path: `${BOOKMARK_PATH}/:bookmarkUuid` }), ({ request }) => {
        deletedPath = new URL(request.url).pathname
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderListPage(ROUTE_PATH.PARKING_CAR_BOOKMARK_LIST)

    await userEvent.click(await screen.findByText('12가3456'))
    await userEvent.click(await screen.findByRole('button', { name: '삭제' }))

    expect(await screen.findByText('차량정보를 삭제하시겠어요?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '삭제' }))

    await screen.findByText('삭제되었습니다')
    expect(deletedPath).toContain('/bookmark/bookmark-1')
  })

  it('항상허용 삭제는 **입주민 uuid 없이** 항상허용 uuid만 보낸다', async () => {
    let deletedPath = ''
    server.use(
      http.delete(
        url({ path: `${API_PREFIX.PARKING}/always-allow/:alwaysAllowUuid` }),
        ({ request }) => {
          deletedPath = new URL(request.url).pathname
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )

    renderListPage(ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_LIST)

    await userEvent.click(await screen.findByText('34나5678'))
    await userEvent.click(await screen.findByRole('button', { name: '삭제' }))
    await userEvent.click(await screen.findByRole('button', { name: '삭제' }))

    await screen.findByText('삭제되었습니다')
    expect(deletedPath).toBe(`${API_PREFIX.PARKING}/always-allow/always-1`)
  })

  it('`+ 등록하기`는 지금 보고 있는 종류의 등록 화면으로 간다', async () => {
    renderListPage(ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_LIST)

    await screen.findByText('34나5678')
    await userEvent.click(screen.getByRole('button', { name: '+ 등록하기' }))

    expect(await screen.findByRole('heading', { name: '항상허용 등록 화면' })).toBeInTheDocument()
  })

  it('빈 목록·에러 문구가 종류에 따라 갈린다', async () => {
    server.use(
      http.get(url({ path: ALWAYS_ALLOW_PATH }), () => {
        return HttpResponse.json(page({ content: [] }))
      }),
    )

    renderListPage(ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_LIST)

    expect(await screen.findByText('항상허용 차량이 없습니다')).toBeInTheDocument()
  })
})
