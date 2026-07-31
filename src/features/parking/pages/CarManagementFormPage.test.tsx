import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { CarManagementFormPage } from '@/features/parking/pages/CarManagementFormPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const APT_UUID = 'apt-uuid-1'

const RESIDENT_DETAIL_PATH = `${API_PREFIX.APARTMANT}/apt-resident/:uuid`
const VISIT_PURPOSE_PATH = `${API_PREFIX.PARKING}/visit-purpose/${APT_UUID}`
const BOOKMARK_PATH = `${API_PREFIX.PARKING}/${RESIDENT_UUID}/bookmark`
const ALWAYS_ALLOW_POST_PATH = `${API_PREFIX.PARKING}/always-allow/${RESIDENT_UUID}`

const VISIT_PURPOSE = { uuid: 'purpose-1', name: '택배' }

const BOOKMARK_CAR = {
  uuid: 'bookmark-1',
  carNum: '12가3456',
  nickName: '친구차',
  phone: '01012345678',
}

const useContentList = (contentList: { name: string }[]) => {
  server.use(
    http.get(url({ path: RESIDENT_DETAIL_PATH }), () => {
      return HttpResponse.json({ success: { ...MOCK_RESIDENT_DETAIL_INFO, contentList } })
    }),
  )
}

const renderFormPage = ({ path, state }: { path: string; state?: Record<string, unknown> }) => {
  return renderWithProviders({
    initialEntries: [{ pathname: path, state }],
    ui: (
      <Routes>
        <Route path={ROUTE_PATH.PARKING_CAR_BOOKMARK_ADD} element={<CarManagementFormPage />} />
        <Route path={ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_ADD} element={<CarManagementFormPage />} />
        <Route path={ROUTE_PATH.PARKING_CAR_BOOKMARK_EDIT} element={<CarManagementFormPage />} />
        <Route path={ROUTE_PATH.PARKING_CAR_BOOKMARK_LIST} element={<h1>즐겨찾기 목록</h1>} />
      </Routes>
    ),
  })
}

describe('CarManagementFormPage (PK5·PK6·PK7)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID, aptUuid: APT_UUID } })
    useErrorModalStore.setState({ current: null })

    server.use(
      http.get(url({ path: VISIT_PURPOSE_PATH }), () => {
        return HttpResponse.json({ success: [VISIT_PURPOSE] })
      }),
      http.get(url({ path: BOOKMARK_PATH }), () => {
        return HttpResponse.json({
          success: {
            content: [BOOKMARK_CAR],
            number: 0,
            totalPages: 1,
            totalElements: 1,
            last: true,
            empty: false,
            numberOfElements: 1,
          },
        })
      }),
    )
  })

  it('즐겨찾기 등록에는 별칭이 있고 방문목적·메모·불러오기가 없다', async () => {
    renderFormPage({ path: ROUTE_PATH.PARKING_CAR_BOOKMARK_ADD })

    expect(await screen.findByText('별칭')).toBeInTheDocument()
    expect(screen.queryByText('방문 목적')).not.toBeInTheDocument()
    expect(screen.queryByText('메모')).not.toBeInTheDocument()
    expect(screen.queryByText('즐겨찾기 차량 불러오기')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '등록하기' })).toBeInTheDocument()
  })

  it('항상허용 등록에는 방문목적·메모·불러오기가 있고 별칭이 없다', async () => {
    renderFormPage({ path: ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_ADD })

    expect(await screen.findByText('방문 목적')).toBeInTheDocument()
    expect(screen.getByText('메모')).toBeInTheDocument()
    expect(screen.getByText('즐겨찾기 차량 불러오기')).toBeInTheDocument()
    expect(screen.queryByText('별칭')).not.toBeInTheDocument()
  })

  it('월패드 구독 단지에서만 라디오가 붙는다', async () => {
    useContentList([{ name: '차량세대통보' }])

    renderFormPage({ path: ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_ADD })

    expect(await screen.findByText('입출차 시 월패드 알림')).toBeInTheDocument()
    expect(screen.getByLabelText('예')).toBeInTheDocument()
    expect(screen.getByLabelText('아니오')).toBeInTheDocument()
  })

  it('월패드 미구독 단지에는 라디오가 없다', async () => {
    useContentList([{ name: '주차' }])

    renderFormPage({ path: ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_ADD })

    await screen.findByText('방문 목적')
    expect(screen.queryByText('입출차 시 월패드 알림')).not.toBeInTheDocument()
  })

  it('수정 화면은 라우터 state의 값으로 폼을 채우고 연락처에 하이픈을 넣는다', async () => {
    renderFormPage({
      path: '/parking/carManagement/bookmark/edit/bookmark-1',
      state: { carInfo: BOOKMARK_CAR },
    })

    expect(await screen.findByDisplayValue('12가3456')).toBeInTheDocument()
    expect(screen.getByDisplayValue('친구차')).toBeInTheDocument()
    expect(screen.getByDisplayValue('010-1234-5678')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '수정하기' })).toBeInTheDocument()
  })

  it('🔴 수정 화면에 state 없이 들어오면 폼이 통째로 빈다 — 레거시와 같다', async () => {
    renderFormPage({ path: '/parking/carManagement/bookmark/edit/bookmark-1' })

    const carNumInput = await screen.findByPlaceholderText('차량번호를 입력하세요. 예)10서1234')
    expect((carNumInput as HTMLInputElement).value).toBe('')
    expect((screen.getByPlaceholderText('별칭을 입력하세요') as HTMLInputElement).value).toBe('')
  })

  it('불러오기 드로어에서 고르면 차량번호와 연락처만 채워진다', async () => {
    renderFormPage({ path: ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_ADD })

    await userEvent.click(await screen.findByText('즐겨찾기 차량 불러오기'))
    await userEvent.click(await screen.findByText('12가3456'))

    expect(await screen.findByDisplayValue('12가3456')).toBeInTheDocument()
    expect(screen.getByDisplayValue('010-1234-5678')).toBeInTheDocument()
    // 별칭 필드 자체가 없는 화면이다
    expect(screen.queryByDisplayValue('친구차')).not.toBeInTheDocument()
  })

  it('검증에 실패해도 버튼이 눌리고 **인라인 에러**가 뜬다 (게시판은 모달이다)', async () => {
    renderFormPage({ path: ROUTE_PATH.PARKING_CAR_BOOKMARK_ADD })

    await userEvent.click(await screen.findByRole('button', { name: '등록하기' }))

    expect(
      await screen.findByText('123가1234, 서울12가1234 형식으로 입력해주세요'),
    ).toBeInTheDocument()
    expect(screen.getByText('2~10자로 입력해주세요')).toBeInTheDocument()
    // 모달은 뜨지 않는다
    expect(useErrorModalStore.getState().current).toBeNull()
  })

  it('전송 직전에 연락처의 하이픈을 뺀다', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(url({ path: BOOKMARK_PATH }), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderFormPage({ path: ROUTE_PATH.PARKING_CAR_BOOKMARK_ADD })

    await userEvent.type(
      await screen.findByPlaceholderText('차량번호를 입력하세요. 예)10서1234'),
      '12가3456',
    )
    await userEvent.type(screen.getByPlaceholderText('별칭을 입력하세요'), '친구차')
    await userEvent.type(screen.getByPlaceholderText('연락처를 입력하세요'), '01012345678')

    await userEvent.click(screen.getByRole('button', { name: '등록하기' }))

    await screen.findByRole('button', { name: '등록하기' })
    expect(body).toEqual({ carNum: '12가3456', nickName: '친구차', phone: '01012345678' })
  })

  it('항상허용 등록은 방문목적 uuid와 월패드 플래그를 보낸다', async () => {
    useContentList([{ name: '차량세대통보' }])

    let body: Record<string, unknown> = {}
    server.use(
      http.post(url({ path: ALWAYS_ALLOW_POST_PATH }), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderFormPage({ path: ROUTE_PATH.PARKING_CAR_ALWAYS_ALLOW_ADD })

    await userEvent.type(
      await screen.findByPlaceholderText('차량번호를 입력하세요. 예)10서1234'),
      '12가3456',
    )
    await userEvent.type(screen.getByPlaceholderText('연락처를 입력하세요'), '01012345678')

    await userEvent.click(screen.getByPlaceholderText('방문 목적을 선택해주세요'))
    await userEvent.click(await screen.findByText('택배'))

    await userEvent.click(screen.getByLabelText('예'))
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }))

    await screen.findByRole('button', { name: '등록하기' })
    expect(body).toEqual({
      carNum: '12가3456',
      phone: '01012345678',
      visitPurposeUuid: 'purpose-1',
      notificationFlag: true,
    })
  })

  it('중복 등록 에러는 유형별 전용 문구로 바뀐다', async () => {
    server.use(
      http.post(url({ path: BOOKMARK_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'BOOKMARK_DUPLICATED', message: '서버 원문' } },
          { status: 400 },
        )
      }),
    )

    renderFormPage({ path: ROUTE_PATH.PARKING_CAR_BOOKMARK_ADD })

    await userEvent.type(
      await screen.findByPlaceholderText('차량번호를 입력하세요. 예)10서1234'),
      '12가3456',
    )
    await userEvent.type(screen.getByPlaceholderText('별칭을 입력하세요'), '친구차')
    await userEvent.type(screen.getByPlaceholderText('연락처를 입력하세요'), '01012345678')
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }))

    await screen.findByRole('button', { name: '등록하기' })
    expect(useErrorModalStore.getState().current?.text).toBe('이미 등록된 즐겨찾기 차량입니다.')
  })

  it('⚠️ 수정 실패는 전용 분기가 없어 **서버 원문**이 그대로 보인다', async () => {
    server.use(
      http.patch(url({ path: `${BOOKMARK_PATH}/:bookmarkUuid` }), () => {
        return HttpResponse.json(
          // 등록이었다면 전용 문구로 바뀌었을 코드다
          { error: { errorCode: 'BOOKMARK_DUPLICATED', message: '서버 원문' } },
          { status: 400 },
        )
      }),
    )

    renderFormPage({
      path: '/parking/carManagement/bookmark/edit/bookmark-1',
      state: { carInfo: BOOKMARK_CAR },
    })

    await userEvent.click(await screen.findByRole('button', { name: '수정하기' }))

    await screen.findByRole('button', { name: '수정하기' })
    expect(useErrorModalStore.getState().current?.text).toBe('서버 원문')
  })
})
