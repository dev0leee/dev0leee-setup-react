import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MainAdvertisementBanner } from '@/features/main/components/MainAdvertisementBanner'
import { BANNER_APT_UUID } from '@/features/main/constants/shopping'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'

/** 동의 플래그를 지정해 상세정보 응답을 만든다 */
const mockResidentDetailInfo = ({ hasConsent }: { hasConsent: boolean }) => {
  server.use(
    http.get(url({ path: `${API_PREFIX.APARTMANT}/apt-resident/${RESIDENT_UUID}` }), () => {
      return HttpResponse.json({
        success: {
          aptName: '아파트먼트',
          contentList: [],
          marketingDataConsentFlag: hasConsent ? false : null,
          receiveAdvertsConsentFlag: hasConsent ? false : null,
        },
      })
    }),
  )
}

describe('MainAdvertisementBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('일반 단지는 임시 이미지와 Ad 배지를 본다', () => {
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID, aptUuid: 'apt-uuid-x' } })
    mockResidentDetailInfo({ hasConsent: false })
    renderWithProviders({ ui: <MainAdvertisementBanner onOpenShoppingTerms={vi.fn()} /> })

    expect(screen.getByAltText('배너 임시 이미지')).toBeInTheDocument()
    expect(screen.getByText('Ad')).toBeInTheDocument()
  })

  it('에테르노 청담은 전용 이미지를 보고 Ad 배지가 없다', () => {
    useAuthStore.setState({
      aptInfo: { aptResidentUuid: RESIDENT_UUID, aptUuid: BANNER_APT_UUID.ETERNO },
    })
    mockResidentDetailInfo({ hasConsent: false })
    renderWithProviders({ ui: <MainAdvertisementBanner onOpenShoppingTerms={vi.fn()} /> })

    expect(screen.getByAltText('청담 에테르노 배너 이미지')).toBeInTheDocument()
    expect(screen.queryByText('Ad')).not.toBeInTheDocument()
  })

  it('샘물정보통신 배너를 누르면 동의 이력이 없어 약관 시트가 열린다', async () => {
    useAuthStore.setState({
      aptInfo: { aptResidentUuid: RESIDENT_UUID, aptUuid: BANNER_APT_UUID.SAMMUL },
    })
    mockResidentDetailInfo({ hasConsent: false })
    const onOpenShoppingTerms = vi.fn()

    renderWithProviders({
      ui: <MainAdvertisementBanner onOpenShoppingTerms={onOpenShoppingTerms} />,
    })
    await userEvent.click(await screen.findByAltText('배너 광고 이미지'))

    await waitFor(() => {
      expect(onOpenShoppingTerms).toHaveBeenCalled()
    })
  })

  it('동의 이력이 있으면 시트 없이 바로 쇼핑몰이 열린다', async () => {
    // ⚠️ 판정은 값이 아니라 `null` 여부다 — `false`로 저장한 사용자에게 다시 묻지 않는다
    useAuthStore.setState({
      aptInfo: { aptResidentUuid: RESIDENT_UUID, aptUuid: BANNER_APT_UUID.SAMMUL },
    })
    mockResidentDetailInfo({ hasConsent: true })
    server.use(
      http.get(url({ path: `${API_PREFIX.APARTMANT}/commerce/token` }), () => {
        return HttpResponse.json({
          success: {
            accessToken: 'a',
            expiresIn: 1,
            refreshToken: 'r',
            refreshTokenExpiresIn: 2,
          },
        })
      }),
    )
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    const onOpenShoppingTerms = vi.fn()

    renderWithProviders({
      ui: <MainAdvertisementBanner onOpenShoppingTerms={onOpenShoppingTerms} />,
    })
    await userEvent.click(await screen.findByAltText('배너 광고 이미지'))

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalled()
    })
    expect(onOpenShoppingTerms).not.toHaveBeenCalled()
  })
})
