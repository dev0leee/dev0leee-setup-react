import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TempPasswordCreatePage } from '@/features/visit/pages/TempPasswordCreatePage'
import { TempPasswordListPage } from '@/features/visit/pages/TempPasswordListPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { fireEvent, renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const LIST_PATH = `${API_PREFIX.APARTMANT}/${RESIDENT_UUID}/lobby-phone/temp-password`

/** 달 한가운데로 고정한다 — 오늘+13일이 월을 넘지 않게 */
const TODAY = new Date(2026, 6, 10, 9, 0, 0)

const TEMP_PASSWORD = {
  uuid: 'temp-1',
  tempPasswordType: 'TEMPOTP',
  password: '123456',
  residentName: '홍길동',
  endDate: '2026-08-12',
  description: '택배\n문앞에',
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  useErrorModalStore.setState({ current: null })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('TempPasswordListPage (V4)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.VISIT_TEMP_PASSWORD_LIST],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.VISIT_TEMP_PASSWORD_LIST} element={<TempPasswordListPage />} />
          <Route path={ROUTE_PATH.VISIT_TEMP_PASSWORD_CREATE} element={<h1>생성 화면</h1>} />
          <Route path={ROUTE_PATH.MAIN} element={<h1>메인</h1>} />
        </Routes>
      ),
    })
  }

  const useList = (list: unknown[]) => {
    server.use(
      http.get(url({ path: LIST_PATH }), () => {
        return HttpResponse.json({ success: list })
      }),
    )
  }

  it('유형 배지·비밀번호·생성자를 보여주고 메모를 한 줄로 누른다', async () => {
    useList([TEMP_PASSWORD])

    renderPage()

    expect(await screen.findByText('일회용')).toBeInTheDocument()
    expect(screen.getByText('123456')).toBeInTheDocument()
    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('~2026-08-12')).toBeInTheDocument()
    // 줄바꿈이 공백으로 눌린다
    expect(screen.getByText('택배 문앞에')).toBeInTheDocument()
  })

  it('생성자가 없으면 `관리자`로 보여준다', async () => {
    useList([{ ...TEMP_PASSWORD, residentName: null }])

    renderPage()

    expect(await screen.findByText('관리자')).toBeInTheDocument()
  })

  it('기간형은 배지가 다르다', async () => {
    useList([{ ...TEMP_PASSWORD, tempPasswordType: 'TEMPTERM' }])

    renderPage()

    expect(await screen.findByText('기간형')).toBeInTheDocument()
  })

  it('🔴 삭제가 **확인 없이 즉시** 실행된다', async () => {
    useList([TEMP_PASSWORD])

    let deleted = false
    server.use(
      http.delete(url({ path: `${LIST_PATH}/:uuid` }), () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await userEvent.click(await screen.findByAltText('삭제 아이콘'))

    await waitFor(() => {
      expect(deleted).toBe(true)
    })
  })

  it('10개면 `+`를 눌러도 생성 화면으로 가지 않는다', async () => {
    useList(
      Array.from({ length: 10 }, (_, index) => {
        return { ...TEMP_PASSWORD, uuid: `temp-${index}` }
      }),
    )

    renderPage()
    await screen.findByAltText('플러스 아이콘')
    await userEvent.click(screen.getByAltText('플러스 아이콘'))

    expect(screen.queryByRole('heading', { name: '생성 화면' })).not.toBeInTheDocument()
  })

  it('10개 미만이면 생성 화면으로 간다', async () => {
    useList([TEMP_PASSWORD])

    renderPage()
    await screen.findByText('123456')
    await userEvent.click(screen.getByAltText('플러스 아이콘'))

    expect(await screen.findByRole('heading', { name: '생성 화면' })).toBeInTheDocument()
  })

  it('0건이면 빈 문구만 보이고 안내 문구는 없다', async () => {
    useList([])

    renderPage()

    expect(await screen.findByText('임시 비밀번호가 없습니다.')).toBeInTheDocument()
    expect(
      screen.queryByText('임시 비밀번호는 세대당 10개까지 생성할 수 있습니다.'),
    ).not.toBeInTheDocument()
  })

  it('⚠️ 조회에 실패하면 모달을 띄우고 메인으로 보낸다', async () => {
    server.use(
      http.get(url({ path: LIST_PATH }), () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderPage()

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe(
        '임시 비밀번호 리스트 조회에 실패하였습니다.',
      )
    })
  })
})

describe('TempPasswordCreatePage (V5)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.VISIT_TEMP_PASSWORD_CREATE],
      ui: (
        <Routes>
          <Route
            path={ROUTE_PATH.VISIT_TEMP_PASSWORD_CREATE}
            element={<TempPasswordCreatePage />}
          />
          <Route path={ROUTE_PATH.VISIT_TEMP_PASSWORD_LIST} element={<h1>목록 화면</h1>} />
        </Routes>
      ),
    })
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(TODAY)
  })

  it('일회용 탭에서는 날짜 선택기와 기간 버튼이 없다', () => {
    renderPage()

    expect(screen.getByText('한번만 사용할 수 있는 임시 비밀번호 입니다.')).toBeInTheDocument()
    expect(screen.queryByText('1일')).not.toBeInTheDocument()
  })

  it('일회용 유효기간은 `오늘+13일 (14일)`이다', () => {
    renderPage()

    expect(screen.getByText(/2026-07-23/)).toBeInTheDocument()
    expect(screen.getByText('(14일)')).toBeInTheDocument()
  })

  it('기간형 탭으로 바꾸면 날짜 선택기와 기간 버튼이 나온다', () => {
    renderPage()
    fireEvent.click(screen.getByText('기간형'))

    expect(screen.getByText('기간 내에 여러번 사용할 수 있는')).toBeInTheDocument()
    expect(screen.getByText('1일')).toBeInTheDocument()
    expect(screen.getByText('직접 선택')).toBeInTheDocument()
  })

  it('🔴 `1일`을 고르면 종료일이 **내일**이 된다', () => {
    renderPage()
    fireEvent.click(screen.getByText('기간형'))
    fireEvent.click(screen.getByText('1일'))

    expect(screen.getByText(/2026-07-11 \(토\)/)).toBeInTheDocument()
  })

  it('⚠️ 시작일 선택기는 항상 비활성이다', () => {
    renderPage()
    fireEvent.click(screen.getByText('기간형'))

    const dateButtons = screen.getAllByRole('button', { name: /2026-07/ })
    expect(dateButtons[0]).toBeDisabled()
  })

  it('`직접 선택`을 눌러야 종료일 선택기가 열린다', () => {
    renderPage()
    fireEvent.click(screen.getByText('기간형'))

    const beforeButtons = screen.getAllByRole('button', { name: /2026-07/ })
    expect(beforeButtons[1]).toBeDisabled()

    fireEvent.click(screen.getByText('직접 선택'))

    const afterButtons = screen.getAllByRole('button', { name: /2026-07/ })
    expect(afterButtons[1]).toBeEnabled()
  })

  it('탭을 바꾸면 메모와 기간이 초기화된다', () => {
    renderPage()
    fireEvent.click(screen.getByText('기간형'))
    fireEvent.click(screen.getByText('3일'))
    fireEvent.change(screen.getByPlaceholderText('메모를 입력해주세요.'), {
      target: { value: '택배' },
    })

    expect(screen.getByDisplayValue('택배')).toBeInTheDocument()

    fireEvent.click(screen.getByText('일회용'))
    fireEvent.click(screen.getByText('기간형'))

    expect(screen.queryByDisplayValue('택배')).not.toBeInTheDocument()
    // 종료일이 오늘로 돌아온다
    expect(screen.getByText(/2026-07-10 \(금\)/)).toBeInTheDocument()
  })

  it('일회용을 만들면 오늘+13일을 종료일로 보내고 목록으로 이동한다', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(url({ path: LIST_PATH }), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    fireEvent.change(screen.getByPlaceholderText('메모를 입력해주세요.'), {
      target: { value: '택배' },
    })
    fireEvent.click(screen.getByRole('button', { name: '생성하기' }))

    expect(await screen.findByRole('heading', { name: '목록 화면' })).toBeInTheDocument()
    expect(body).toEqual({
      tempPasswordType: 'TEMPOTP',
      startDate: '2026-07-10',
      endDate: '2026-07-23',
      description: '택배',
    })
  })
})
