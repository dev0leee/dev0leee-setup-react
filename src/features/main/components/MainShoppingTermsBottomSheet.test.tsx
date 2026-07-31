import { http, HttpResponse } from 'msw'
import { Toaster } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MainShoppingTermsBottomSheet } from '@/features/main/components/MainShoppingTermsBottomSheet'
import { SHOPPING_MALL_URL } from '@/features/main/constants/shopping'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'

const CONSENT_PATH = `${API_PREFIX.APARTMANT}/apt-resident/${RESIDENT_UUID}/notification-setting/marketing-consent`
const TOKEN_PATH = `${API_PREFIX.APARTMANT}/commerce/token`

const MOCK_SHOPPING_TOKEN = {
  accessToken: 'shop-access',
  expiresIn: 3600,
  refreshToken: 'shop-refresh',
  refreshTokenExpiresIn: 7200,
}

/** 저장된 동의 플래그를 받아둘 배열 */
const setUpHandlers = () => {
  const savedConsents: { marketingDataConsentFlag: boolean; receiveAdvertsConsentFlag: boolean }[] =
    []

  server.use(
    http.put(url({ path: CONSENT_PATH }), async ({ request }) => {
      savedConsents.push(
        (await request.json()) as {
          marketingDataConsentFlag: boolean
          receiveAdvertsConsentFlag: boolean
        },
      )
      return HttpResponse.json({ success: null })
    }),
    http.get(url({ path: TOKEN_PATH }), () => {
      return HttpResponse.json({ success: MOCK_SHOPPING_TOKEN })
    }),
  )

  return savedConsents
}

describe('MainShoppingTermsBottomSheet', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  })

  it('두 약관이 처음부터 체크된 상태로 열린다', () => {
    setUpHandlers()
    renderWithProviders({ ui: <MainShoppingTermsBottomSheet onClose={vi.fn()} /> })

    expect(screen.getByText('쇼핑 혜택 정보를 알려드릴게요')).toBeInTheDocument()
    screen.getAllByRole('checkbox').forEach((checkbox) => {
      expect(checkbox).toBeChecked()
    })
  })

  it('동의하고 시작하기를 누르면 true로 저장하고 쇼핑몰을 연다', async () => {
    const savedConsents = setUpHandlers()
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    const onClose = vi.fn()

    renderWithProviders({ ui: <MainShoppingTermsBottomSheet onClose={onClose} /> })
    await userEvent.click(screen.getByText('동의하고 시작하기'))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })

    expect(savedConsents).toEqual([
      { marketingDataConsentFlag: true, receiveAdvertsConsentFlag: true },
    ])
    // 토큰 4개가 쿼리스트링으로 실린다 (`deferred.md` D-39)
    expect(openSpy).toHaveBeenCalledWith(
      `${SHOPPING_MALL_URL}/?accessToken=shop-access&expiresIn=3600&refreshToken=shop-refresh&refreshTokenExpiresIn=7200`,
      '_blank',
    )
  })

  it('괜찮아요를 눌러도 false로 저장한 뒤 쇼핑몰이 열린다', async () => {
    // ⚠️ 거절이 곧 차단이 아니다 — 동의는 마케팅 수신용이다 (`main.md` §11)
    const savedConsents = setUpHandlers()
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    const onClose = vi.fn()

    renderWithProviders({ ui: <MainShoppingTermsBottomSheet onClose={onClose} /> })
    await userEvent.click(screen.getByText('괜찮아요'))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })

    expect(savedConsents).toEqual([
      { marketingDataConsentFlag: false, receiveAdvertsConsentFlag: false },
    ])
    expect(openSpy).toHaveBeenCalled()
  })

  it('마케팅 동의를 끄면 광고성 수신도 함께 꺼진다', async () => {
    const savedConsents = setUpHandlers()
    vi.spyOn(window, 'open').mockReturnValue(null)

    renderWithProviders({ ui: <MainShoppingTermsBottomSheet onClose={vi.fn()} /> })

    const [marketingCheckbox, advertsCheckbox] = screen.getAllByRole('checkbox')
    await userEvent.click(marketingCheckbox as HTMLElement)

    expect(advertsCheckbox).not.toBeChecked()

    await userEvent.click(screen.getByText('동의하고 시작하기'))

    await waitFor(() => {
      expect(savedConsents).toEqual([
        { marketingDataConsentFlag: false, receiveAdvertsConsentFlag: false },
      ])
    })
  })

  it('토큰 발급이 실패하면 토스트를 띄우고 쇼핑몰을 열지 않는다', async () => {
    setUpHandlers()
    server.use(
      http.get(url({ path: TOKEN_PATH }), () => {
        return HttpResponse.json({ error: { errorCode: 'X', message: 'x' } }, { status: 500 })
      }),
    )
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)

    renderWithProviders({
      // 토스트는 Toaster가 있어야 렌더된다
      ui: (
        <>
          <MainShoppingTermsBottomSheet onClose={vi.fn()} />
          <Toaster />
        </>
      ),
    })
    await userEvent.click(screen.getByText('동의하고 시작하기'))

    expect(await screen.findByText(/현재 접속이 불가합니다/)).toBeInTheDocument()
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('보기를 누르면 약관 본문 모달이 열린다', async () => {
    setUpHandlers()
    renderWithProviders({ ui: <MainShoppingTermsBottomSheet onClose={vi.fn()} /> })

    const [viewButton] = screen.getAllByText('보기')
    await userEvent.click(viewButton as HTMLElement)

    // 모달 안의 iframe 제목이 약관 이름이다
    expect(await screen.findByTitle('마케팅 목적의 개인정보 수집 및 이용')).toBeInTheDocument()
  })
})
