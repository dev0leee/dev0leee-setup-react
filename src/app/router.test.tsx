import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { routes } from '@/app/router'
import { API_PREFIX } from '@/shared/constants/api'
import { NATIVE_HANDLER, TO_NATIVE } from '@/shared/constants/native'
import { STORAGE_KEY } from '@/shared/constants/storage'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'

/**
 * Phase 4의 완료 조건은 **로그인 → 메인 진입이 실제 계약으로 동작하는 것**이다.
 * 실기기 대신 MSW로 그 사슬을 통째로 검증한다:
 *
 *   폼 제출 → 헤더 토큰 저장 → login/info + 단지목록 조회 → aptInfo 적재
 *   → 네이티브 SEND_INITIAL_RESIDENT_INFO 발신 → 가드 통과 → 셸(하단 탭) 렌더
 *
 * `routes`는 실제 앱이 쓰는 트리 그대로다. 테스트용 라우트를 따로 만들면
 * 배선이 어긋나도 알 수 없다.
 */

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

const renderApp = async ({ initialPath = '/' }: { initialPath?: string } = {}) => {
  // 라우터를 테스트마다 새로 만든다. 히스토리가 테스트 간에 새면 안 된다.
  const { createMemoryRouter, RouterProvider } = await import('react-router-dom')
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('로그인 → 메인 진입', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    Reflect.deleteProperty(window, NATIVE_HANDLER)
  })

  it('세션이 없으면 루트에서 인트로로 보낸다', async () => {
    await renderApp()

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
  })

  it('로그인하면 토큰·단지정보가 저장되고 메인 셸이 뜬다', async () => {
    // 네이티브 발신을 확인하려면 UA와 핸들러가 둘 다 있어야 한다.
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ANDROID_UA)
    const postMessage = vi.fn()
    Object.assign(window, { [NATIVE_HANDLER]: { postMessage } })

    await renderApp()

    await userEvent.type(await screen.findByLabelText('휴대폰 번호'), '010-1234-5678')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'abcd1234!')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    // 단지 이름이 보이면 aptInfo 적재까지 끝난 것이다.
    expect(await screen.findByRole('heading', { name: '아파트먼트 1단지' })).toBeInTheDocument()
    expect(screen.getByText('홍길동님')).toBeInTheDocument()

    // 헤더로 온 토큰이 레거시 키에 raw로 저장됐는지
    expect(localStorage.getItem(STORAGE_KEY.ACCESS_TOKEN)).toBe('mock-access-token')
    expect(localStorage.getItem(STORAGE_KEY.REFRESH_TOKEN)).toBe('mock-refresh-token')

    // 하단 탭(셸)이 렌더됐고 현재 탭이 활성인지
    expect(screen.getByText('우리아파트')).toBeInTheDocument()
    expect(screen.getByAltText('우리아파트 아이콘')).toHaveAttribute(
      'src',
      '/assets/icons/bottomNav/HomeActive.svg',
    )

    // 네이티브에 입주민 정보를 보냈는지. `' 로비폰 '`의 공백을 trim으로 넘겼는지가 핵심이다.
    const sentBodies = postMessage.mock.calls.map((call) => {
      return String(call[0])
    })
    const initialInfoBody = sentBodies.find((body) => {
      return body.includes(TO_NATIVE.SEND_INITIAL_RESIDENT_INFO)
    })
    expect(initialInfoBody).toBeDefined()
    expect((JSON.parse(String(initialInfoBody)) as { data: unknown }).data).toEqual({
      aptResidentUuid: 'resident-uuid-1',
      hasAptApassService: true,
      hasResidentApassService: true,
      isDeviceApassActive: false,
      hasAptLobbyPhoneService: true,
      hasResidentLobbyPhoneService: true,
    })
  })

  it('아이디·비밀번호가 틀리면 에러 모달 문구가 레거시와 같다', async () => {
    server.use(
      http.post(url({ path: `${API_PREFIX.APARTMANT}/login` }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'INVALID_PASSWORD', message: '서버 원문 메시지' } },
          { status: 400 },
        )
      }),
    )

    await renderApp()

    await userEvent.type(await screen.findByLabelText('휴대폰 번호'), '010-1234-5678')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'abcd1234!')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    // 서버 원문이 아니라 레거시 고정 문구를 쓴다. 어느 쪽이 틀렸는지 알려주지 않는다.
    // 모달은 App.tsx에 마운트되므로 라우터 트리에는 없다 → 스토어 값으로 확인한다.
    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe(
        '아이디 또는 비밀번호가 일치하지 않습니다.',
      )
    })
  })

  it('미승인 세대는 승인 대기 화면으로 보낸다', async () => {
    server.use(
      http.post(url({ path: `${API_PREFIX.APARTMANT}/login` }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'RESIDENT_NOT_APPROVED', message: '미승인' } },
          { status: 400 },
        )
      }),
      http.get(url({ path: `${API_PREFIX.APARTMANT}/login/waiting-info` }), () => {
        return HttpResponse.json({ success: { uuid: 'waiting-uuid', contentList: [] } })
      }),
    )

    await renderApp()

    await userEvent.type(await screen.findByLabelText('휴대폰 번호'), '010-1234-5678')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'abcd1234!')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    // `/login/pending` 화면은 Phase 6에서 만든다. 지금은 NotFound가 뜨는 것이
    // "이동은 일어났다"는 증거다 — 라우트가 추가되면 이 기대값을 바꾼다.
    expect(await screen.findByText('경로가 올바르지 않습니다')).toBeInTheDocument()
  })

  it('저장된 세션이 있으면 인트로에서 메인으로 넘긴다', async () => {
    localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, 'stored-token')
    localStorage.setItem(STORAGE_KEY.APT_INFO, JSON.stringify({ aptResidentUuid: 'r-1' }))

    await renderApp({ initialPath: '/intro' })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: '로그인' })).not.toBeInTheDocument()
    })
  })
})
