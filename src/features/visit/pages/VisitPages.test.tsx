import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { KioskPasswordPage } from '@/features/visit/pages/KioskPasswordPage'
import { LobbyPhonePage } from '@/features/visit/pages/LobbyPhonePage'
import { VisitListPage } from '@/features/visit/pages/VisitListPage'
import { API_PREFIX } from '@/shared/constants/api'
import { FROM_NATIVE } from '@/shared/constants/native'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { emitInternal } from '@/shared/lib/native/bridge'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { fireEvent, renderWithProviders, screen, userEvent, waitFor, within } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const APT_UUID = 'apt-uuid-1'

const RESIDENT_DETAIL_PATH = `${API_PREFIX.APARTMANT}/apt-resident/:uuid`
const KIOSK_PASSWORD_PATH = `${API_PREFIX.APARTMANT}/${APT_UUID}/apt/household/kiosk/password/${RESIDENT_UUID}`
const LOBBY_PHONE_PASSWORD_PATH = `${API_PREFIX.APARTMANT}/${RESIDENT_UUID}/lobby-phone/password`

const useContentList = (contentList: { name: string }[]) => {
  server.use(
    http.get(url({ path: RESIDENT_DETAIL_PATH }), () => {
      return HttpResponse.json({ success: { ...MOCK_RESIDENT_DETAIL_INFO, contentList } })
    }),
  )
}

/** 4칸에 비밀번호를 입력한다. `userEvent.type`은 느리고 타이머에 얽혀서 직접 넣는다 */
const typePassword = (password: string) => {
  const inputs = screen.getAllByRole('textbox')

  Array.from(password).forEach((digit, index) => {
    fireEvent.change(inputs[index] as HTMLElement, { target: { value: digit } })
  })
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID, aptUuid: APT_UUID } })
  useErrorModalStore.setState({ current: null })
})

afterEach(() => {
  // 가짜 타이머를 켠 테스트가 실패해도 다음 테스트로 새지 않게 한다
  vi.useRealTimers()
})

describe('VisitListPage (V1)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.VISIT],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.VISIT} element={<VisitListPage />} />
          <Route path={ROUTE_PATH.VISIT_LOBBY_PHONE} element={<h1>로비폰 화면</h1>} />
          <Route path={ROUTE_PATH.VISIT_KIOSK_PASSWORD} element={<h1>키오스크 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('구독한 서비스에 해당하는 카드만 보인다', async () => {
    useContentList([{ name: '로비폰' }])

    renderPage()

    expect(await screen.findByText('로비폰')).toBeInTheDocument()
    expect(screen.queryByText('방문증 키오스크 비밀번호')).not.toBeInTheDocument()
  })

  it('⚠️ 둘 다 구독하지 않으면 **빈 화면**이다 (안내 문구가 없다)', async () => {
    useContentList([{ name: '주차' }])

    renderPage()

    await waitFor(() => {
      expect(screen.queryByText('로비폰')).not.toBeInTheDocument()
    })
    expect(screen.queryByText('방문증 키오스크 비밀번호')).not.toBeInTheDocument()
  })

  it('카드를 누르면 각 화면으로 간다', async () => {
    useContentList([{ name: '로비폰' }, { name: '방문증' }])

    renderPage()

    await userEvent.click(await screen.findByText('방문증 키오스크 비밀번호'))
    expect(await screen.findByRole('heading', { name: '키오스크 화면' })).toBeInTheDocument()
  })
})

describe('KioskPasswordPage (V2)', () => {
  const renderPage = () => {
    return renderWithProviders({ ui: <KioskPasswordPage /> })
  }

  it('메뉴 두 줄을 보여준다', () => {
    renderPage()

    expect(screen.getByText('현재 비밀번호 확인')).toBeInTheDocument()
    expect(screen.getByText('비밀번호 변경하기')).toBeInTheDocument()
  })

  it('🔴 같은 숫자가 반복되는 비밀번호도 4칸으로 정상 렌더된다', async () => {
    server.use(
      http.get(url({ path: KIOSK_PASSWORD_PATH }), () => {
        return HttpResponse.json({ success: { password: '1123' } })
      }),
    )

    renderPage()
    await userEvent.click(screen.getByText('현재 비밀번호 확인'))

    // 메뉴 항목과 모달 제목이 같은 문구다 — 뒤에 오는 모달 쪽을 잡는다
    const titles = await screen.findAllByText('현재 비밀번호 확인')
    const modal = titles[titles.length - 1]?.closest('div.fixed')
    const digits = within(modal as HTMLElement).getAllByRole('listitem')

    expect(
      digits.map((digit) => {
        return digit.textContent
      }),
    ).toEqual(['1', '1', '2', '3'])
  })

  it('비밀번호 4자리를 채워야 `변경` 버튼이 눌린다', async () => {
    renderPage()
    await userEvent.click(screen.getByText('비밀번호 변경하기'))

    const submitButton = await screen.findByRole('button', { name: '변경' })
    expect(submitButton).toBeDisabled()

    typePassword('1234')
    expect(submitButton).toBeEnabled()
  })

  it('세대원이 변경하면 전용 문구가 뜬다', async () => {
    server.use(
      http.put(url({ path: KIOSK_PASSWORD_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'NOT_HEAD_AUTHORITY', message: '서버 원문' } },
          { status: 400 },
        )
      }),
    )

    renderPage()
    await userEvent.click(screen.getByText('비밀번호 변경하기'))
    typePassword('1234')
    await userEvent.click(screen.getByRole('button', { name: '변경' }))

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe(
        '세대주만 비밀번호 변경이 가능합니다.',
      )
    })
  })
})

describe('LobbyPhonePage (V3)', () => {
  /** ⚠️ V3는 서버가 아니라 **`aptInfo`(localStorage)** 의 구독 목록을 직접 읽는다 */
  const setStoreContentList = (contentList: { name: string }[]) => {
    useAuthStore.setState({
      aptInfo: { aptResidentUuid: RESIDENT_UUID, aptUuid: APT_UUID, contentList },
    })
  }

  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.VISIT_LOBBY_PHONE],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.VISIT_LOBBY_PHONE} element={<LobbyPhonePage />} />
          <Route path={ROUTE_PATH.VISIT} element={<h1>방문자 출입관리</h1>} />
          <Route path={ROUTE_PATH.MYPAGE_ALARM_SETTING} element={<h1>알림 설정</h1>} />
        </Routes>
      ),
    })
  }

  it('웹에서는 SIP 상태가 `정보없음`이다 — 앱 콜백이 오지 않는다', async () => {
    setStoreContentList([{ name: '로비폰' }])

    renderPage()

    expect(await screen.findByText('정보없음')).toBeInTheDocument()
  })

  it('앱이 SIP 상태를 보내면 칩이 바뀐다', async () => {
    setStoreContentList([{ name: '로비폰' }])

    renderPage()
    await screen.findByText('정보없음')

    // 전역 콜백 설치는 부팅 코드가 한다. 여기서는 콜백이 파싱 후 하는 일을 그대로 흉내낸다
    emitInternal({
      type: FROM_NATIVE.CALLBACK_LOBBYPHONE_SIP_STATE,
      payload: { isSipActive: true },
    })

    expect(await screen.findByText('정상')).toBeInTheDocument()
  })

  it('안면인식을 구독하지 않으면 메뉴가 **2개**다', async () => {
    setStoreContentList([{ name: '로비폰' }])

    renderPage()

    expect(await screen.findByText('임시 비밀번호')).toBeInTheDocument()
    expect(screen.getByText('1회용 출입 QR코드')).toBeInTheDocument()
    expect(screen.queryByText('안면인식 얼굴 등록')).not.toBeInTheDocument()
  })

  it('안면인식 구독 단지에서는 메뉴가 3개다', async () => {
    setStoreContentList([{ name: '로비폰' }, { name: '안면인식' }])

    renderPage()

    expect(await screen.findByText('안면인식 얼굴 등록')).toBeInTheDocument()
  })

  it('⚠️ 뒤로가기는 히스토리가 아니라 항상 `/visit`로 간다', async () => {
    setStoreContentList([{ name: '로비폰' }])

    renderPage()
    await screen.findByText('임시 비밀번호')

    await userEvent.click(screen.getByAltText('뒤로가기 아이콘'))

    expect(await screen.findByRole('heading', { name: '방문자 출입관리' })).toBeInTheDocument()
  })

  it('경비 호출은 300ms 디바운스로 한 번만 나간다', async () => {
    setStoreContentList([{ name: '로비폰' }])

    // 브릿지는 **userAgent**로 iOS/Android를 가른다. 안드로이드 웹뷰인 척한다
    const originalUserAgent = navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14)',
      configurable: true,
    })

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
    const guardButton = await screen.findByText('경비 호출')

    // 화면이 뜬 뒤에 타이머를 가짜로 바꾼다 — 먼저 바꾸면 `findBy*`가 멈춘다
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    fireEvent.click(guardButton)
    fireEvent.click(guardButton)
    fireEvent.click(guardButton)

    vi.advanceTimersByTime(400)

    expect(
      sent.filter((message) => {
        return String(message).includes('CALL_LOBBYPHONE_GUARD')
      }),
    ).toHaveLength(1)

    delete nativeWindow.JsInterface
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    })
  })

  it('세대 비밀번호 변경 실패는 **서버 원문**이 그대로 뜬다 (키오스크와 다르다)', async () => {
    setStoreContentList([{ name: '로비폰' }])
    server.use(
      http.put(url({ path: LOBBY_PHONE_PASSWORD_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'NOT_HEAD_AUTHORITY', message: '서버 원문' } },
          { status: 400 },
        )
      }),
    )

    renderPage()
    await userEvent.click(await screen.findByText('세대 비밀번호'))
    typePassword('1234')
    await userEvent.click(screen.getByRole('button', { name: '변경' }))

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe('서버 원문')
    })
  })
})
