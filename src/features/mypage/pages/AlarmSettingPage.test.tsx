import { http, HttpResponse } from 'msw'
import { Toaster } from 'sonner'
import { beforeEach, describe, expect, it } from 'vitest'

import { AlarmSettingPage } from '@/features/mypage/pages/AlarmSettingPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const notificationSettingUrl = url({
  path: `${API_PREFIX.APARTMANT}/apt-resident/${RESIDENT_UUID}/notification-setting`,
})

/** 통합 조회 기본값. 테스트마다 필요한 것만 덮는다 */
const DEFAULT_SETTING = {
  regularPushFlag: false,
  externalPushFlag: false,
  wallPadParkingNotificationFlag: false,
  marketingDataConsentFlag: false,
  receiveAdvertsConsentFlag: false,
  marketingDataConsentLastModifiedDateTime: '2026-07-30T13:00:00.000000',
  receiveAdvertsConsentLastModifiedDateTime: '2026-07-30T13:00:00.000000',
}

const mockAlarmApis = ({
  contentList = MOCK_RESIDENT_DETAIL_INFO.contentList,
  setting = DEFAULT_SETTING,
}: {
  contentList?: { name: string }[]
  setting?: Record<string, unknown>
} = {}) => {
  server.use(
    http.get(url({ path: `${API_PREFIX.APARTMANT}/apt-resident/:uuid` }), () => {
      return HttpResponse.json({ success: { ...MOCK_RESIDENT_DETAIL_INFO, contentList } })
    }),
    http.get(notificationSettingUrl, () => {
      return HttpResponse.json({ success: setting })
    }),
  )
}

describe('AlarmSettingPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      aptInfo: { aptResidentUuid: RESIDENT_UUID, aptUuid: 'apt-uuid-1' },
    })
  })

  it('구독한 서비스의 알림 그룹만 보여준다', async () => {
    mockAlarmApis({ contentList: [{ name: '주차' }] })
    renderWithProviders({ ui: <AlarmSettingPage /> })

    expect(await screen.findByText('정기 차량 입출차 알림')).toBeInTheDocument()
    expect(screen.getByText('외부 차량 입출차 알림')).toBeInTheDocument()

    // 로비폰·월패드 미구독 → 그룹이 없다. 마케팅 그룹은 조건 없이 항상 보인다
    expect(screen.queryByText('로비폰 세대호출 알림')).not.toBeInTheDocument()
    expect(screen.queryByText('우리집 월패드 입출차 알림')).not.toBeInTheDocument()
    expect(screen.getByText('마케팅 목적의 개인정보 수집 및 이용 동의')).toBeInTheDocument()
  })

  it('월패드 서비스가 있으면 월패드 그룹이 보인다', async () => {
    mockAlarmApis({ contentList: [{ name: '외부월패드(정기차량)' }] })
    renderWithProviders({ ui: <AlarmSettingPage /> })

    expect(await screen.findByText('우리집 월패드 입출차 알림')).toBeInTheDocument()
  })

  it('토글을 켜면 mutation 응답값을 조회값보다 우선해 반영한다', async () => {
    // 조회값은 false인데 응답은 true다. 무효화 없이 응답값으로 즉시 바뀌어야 한다
    mockAlarmApis({ contentList: [{ name: '주차' }] })
    server.use(
      http.put(`${notificationSettingUrl}/regular-push`, () => {
        return HttpResponse.json({ success: { regularPushFlag: true } })
      }),
    )
    renderWithProviders({ ui: <AlarmSettingPage /> })

    const toggles = await screen.findAllByRole('checkbox')
    const [regularToggle] = toggles
    expect(regularToggle).not.toBeChecked()

    await userEvent.click(regularToggle as HTMLElement)

    await waitFor(() => {
      expect(regularToggle).toBeChecked()
    })
  })

  it('광고성에 동의하면 마케팅도 함께 동의로 보낸다', async () => {
    mockAlarmApis({ contentList: [] })

    let requestBody: Record<string, boolean> | null = null
    server.use(
      http.put(`${notificationSettingUrl}/marketing-consent`, async ({ request }) => {
        requestBody = (await request.json()) as Record<string, boolean>
        return HttpResponse.json({
          success: {
            ...DEFAULT_SETTING,
            marketingDataConsentFlag: true,
            receiveAdvertsConsentFlag: true,
          },
        })
      }),
    )
    renderWithProviders({ ui: <AlarmSettingPage /> })

    const toggles = await screen.findAllByRole('checkbox')
    // 마케팅·광고성 두 개뿐이다. 두 번째가 광고성
    await userEvent.click(toggles[1] as HTMLElement)

    await waitFor(() => {
      expect(requestBody).toEqual({
        marketingDataConsentFlag: true,
        receiveAdvertsConsentFlag: true,
      })
    })
  })

  it('마케팅 동의를 해제하면 광고성도 함께 해제로 보낸다', async () => {
    mockAlarmApis({
      contentList: [],
      setting: {
        ...DEFAULT_SETTING,
        marketingDataConsentFlag: true,
        receiveAdvertsConsentFlag: true,
      },
    })

    let requestBody: Record<string, boolean> | null = null
    server.use(
      http.put(`${notificationSettingUrl}/marketing-consent`, async ({ request }) => {
        requestBody = (await request.json()) as Record<string, boolean>
        return HttpResponse.json({ success: DEFAULT_SETTING })
      }),
    )
    renderWithProviders({ ui: <AlarmSettingPage /> })

    const toggles = await screen.findAllByRole('checkbox')
    await userEvent.click(toggles[0] as HTMLElement)

    await waitFor(() => {
      expect(requestBody).toEqual({
        marketingDataConsentFlag: false,
        receiveAdvertsConsentFlag: false,
      })
    })
  })

  it('동의 토스트를 두 줄로 띄운다 — `<br/>`이 텍스트로 보이면 안 된다', async () => {
    mockAlarmApis({ contentList: [] })
    server.use(
      http.put(`${notificationSettingUrl}/marketing-consent`, () => {
        return HttpResponse.json({
          success: {
            ...DEFAULT_SETTING,
            marketingDataConsentFlag: true,
            marketingDataConsentLastModifiedDateTime: '2026-07-30T14:25:11.123456',
          },
        })
      }),
    )
    // 토스트는 Toaster가 있어야 렌더된다
    renderWithProviders({
      ui: (
        <>
          <AlarmSettingPage />
          <Toaster />
        </>
      ),
    })

    const toggles = await screen.findAllByRole('checkbox')
    await userEvent.click(toggles[0] as HTMLElement)

    // 일시는 앞 16자만 쓴다 → `2026-07-30T14:25`
    const toastBody = await screen.findByText(/동의 일시 2026-07-30T14:25/)

    expect(toastBody.textContent).toContain('마케팅 목적의 개인정보 수집 및 이용')
    // 줄바꿈이 **엘리먼트**여야 한다. 문자열로 넣으면 `&lt;br/&gt;`가 화면에 보인다
    expect(toastBody.querySelector('br')).not.toBeNull()
    expect(toastBody.innerHTML).not.toContain('&lt;br')
  })
})
