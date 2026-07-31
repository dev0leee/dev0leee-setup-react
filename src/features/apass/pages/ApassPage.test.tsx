import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApassPage } from '@/features/apass/pages/ApassPage'
import { API_PREFIX } from '@/shared/constants/api'
import { FROM_NATIVE } from '@/shared/constants/native'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { emitInternal } from '@/shared/lib/native/bridge'
import { useApassLoadingStore } from '@/shared/stores/apassLoadingStore'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { act, renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const FLAG_PATH = `${API_PREFIX.APARTMANT}/a-pass/${RESIDENT_UUID}/apass-on-off-flag`

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36 Mobile Safari/537.36'
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile'

const useFlag = (apassOnOffFlag: boolean) => {
  server.use(
    http.get(url({ path: FLAG_PATH }), () => {
      return HttpResponse.json({ success: { apassOnOffFlag } })
    }),
  )
}

const stubUserAgent = (userAgent: string) => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent)
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  useApassLoadingStore.setState({ isApassLoading: false })
  stubUserAgent(ANDROID_UA)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const renderPage = () => {
  return renderWithProviders({
    initialEntries: [ROUTE_PATH.APASS],
    ui: (
      <Routes>
        <Route path={ROUTE_PATH.APASS} element={<ApassPage />} />
      </Routes>
    ),
  })
}

describe('ApassPage (AP1)', () => {
  it('활성 상태면 문구와 이미지가 활성용으로 바뀐다', async () => {
    useFlag(true)

    renderPage()

    expect(await screen.findByText('A-PASS 활성화')).toBeInTheDocument()
    expect(screen.getByAltText('수신 활성화 이미지')).toBeInTheDocument()
  })

  it('비활성 상태면 비활성 문구·이미지가 나온다', async () => {
    useFlag(false)

    renderPage()

    expect(await screen.findByText('A-PASS 비활성화')).toBeInTheDocument()
    expect(screen.getByAltText('수신 비활성화 이미지')).toBeInTheDocument()
  })

  it('⚠️ 권한 응답 전에는 **전부 허용안됨**으로 보인다', async () => {
    useFlag(false)

    renderPage()

    expect(await screen.findByText('블루투스 접근 권한 허용안됨')).toBeInTheDocument()
    expect(screen.getByText('GPS 접근 권한 허용안됨')).toBeInTheDocument()
    expect(screen.getByText(/위치 항상허용\s+비활성화/)).toBeInTheDocument()
  })

  it('권한 정보를 받으면 항목이 갱신된다', async () => {
    useFlag(false)

    renderPage()
    await screen.findByText('블루투스 접근 권한 허용안됨')

    act(() => {
      emitInternal({
        type: FROM_NATIVE.CALLBACK_PERMISSION_INFO,
        payload: { btOn: true, gpsEnabled: true, locAlawaysOn: false, btTransmitt: true },
      })
    })

    expect(await screen.findByText('블루투스 접근 권한 허용됨')).toBeInTheDocument()
    expect(screen.getByText('단말기 A-PASS 송수신 지원')).toBeInTheDocument()
  })

  it('⚠️ **Android는 권한 4개, iOS는 3개**다 (송수신 항목이 없다)', async () => {
    useFlag(false)

    renderPage()
    expect(await screen.findByText(/단말기 A-PASS 송수신/)).toBeInTheDocument()

    stubUserAgent(IOS_UA)
    renderPage()

    await waitFor(() => {
      // 두 번째 렌더에는 송수신 항목이 없다 — 앞선 렌더의 것 하나만 남는다
      expect(screen.getAllByText(/단말기 A-PASS 송수신/)).toHaveLength(1)
    })
  })

  it('토글을 누르면 300ms 뒤에 앱으로 요청이 나가고 스피너가 뜬다', async () => {
    useFlag(false)

    const sent: unknown[] = []
    const nativeWindow = window as unknown as {
      JsInterface?: { postMessage: (message: string) => void }
    }
    nativeWindow.JsInterface = {
      postMessage: (message) => {
        sent.push(message)
      },
    }

    renderPage()
    await screen.findByText('A-PASS 비활성화')

    await userEvent.click(screen.getByAltText('화살표 아이콘'))

    await waitFor(() => {
      expect(
        sent.some((message) => {
          return String(message).includes('SET_APASS_STATE')
        }),
      ).toBe(true)
    })
    expect(useApassLoadingStore.getState().isApassLoading).toBe(true)

    delete nativeWindow.JsInterface
  })

  it('앱이 응답하면 로딩과 **전역 뒤로가기 차단이 함께 풀린다**', async () => {
    useFlag(false)

    renderPage()
    await screen.findByText('A-PASS 비활성화')

    act(() => {
      useApassLoadingStore.getState().setIsApassLoading(true)
    })

    act(() => {
      emitInternal({
        type: FROM_NATIVE.CALLBACK_APASS_STATE,
        payload: { isDeviceApassActive: true },
      })
    })

    expect(useApassLoadingStore.getState().isApassLoading).toBe(false)
  })

  it('✅ 앱이 응답하지 않아도 **7초 뒤 전역 플래그가 풀린다** (AP-Q3)', async () => {
    useFlag(false)

    const nativeWindow = window as unknown as {
      JsInterface?: { postMessage: (message: string) => void }
    }
    nativeWindow.JsInterface = {
      postMessage: () => {
        return undefined
      },
    }

    renderPage()
    await screen.findByText('A-PASS 비활성화')

    // 클릭 이후부터 타이머를 잡는다. 그 전에 켜면 MSW·waitFor가 멈춘다
    vi.useFakeTimers({ shouldAdvanceTime: true })

    await userEvent.click(screen.getByAltText('화살표 아이콘'))

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(useApassLoadingStore.getState().isApassLoading).toBe(true)

    act(() => {
      vi.advanceTimersByTime(7000)
    })

    // 🔴 레거시는 여기서 전역 플래그를 못 내려 뒤로가기가 영구히 막혔다
    expect(useApassLoadingStore.getState().isApassLoading).toBe(false)

    delete nativeWindow.JsInterface
  })

  it('앱 상태가 서버와 다르면 토글 API를 부른다', async () => {
    useFlag(false)

    let patched = false
    server.use(
      http.patch(url({ path: FLAG_PATH }), () => {
        patched = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await screen.findByText('A-PASS 비활성화')

    vi.useFakeTimers({ shouldAdvanceTime: true })

    act(() => {
      emitInternal({
        type: FROM_NATIVE.CALLBACK_APASS_STATE,
        payload: { isDeviceApassActive: true },
      })
    })

    act(() => {
      vi.advanceTimersByTime(1100)
    })

    await waitFor(() => {
      expect(patched).toBe(true)
    })
  })

  it('앱 상태가 서버와 같으면 **토글 API를 부르지 않는다**', async () => {
    useFlag(false)

    let patched = false
    server.use(
      http.patch(url({ path: FLAG_PATH }), () => {
        patched = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await screen.findByText('A-PASS 비활성화')

    vi.useFakeTimers({ shouldAdvanceTime: true })

    act(() => {
      emitInternal({
        type: FROM_NATIVE.CALLBACK_APASS_STATE,
        payload: { isDeviceApassActive: false },
      })
    })

    act(() => {
      vi.advanceTimersByTime(1100)
    })

    expect(patched).toBe(false)
  })
})
