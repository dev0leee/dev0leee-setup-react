import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { LobbyPhoneQrPage } from '@/features/visit/pages/LobbyPhoneQrPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { MOCK_RESIDENT_DETAIL_INFO, url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const QR_PATH = `${API_PREFIX.APARTMANT}/${RESIDENT_UUID}/lobby-phone/qr`
const RESIDENT_DETAIL_PATH = `${API_PREFIX.APARTMANT}/apt-resident/:uuid`

/**
 * ⚠️ **QR 캔버스 자체는 테스트하지 않는다.** `qrcode`는 실제 캔버스 2D 컨텍스트를
 * 요구하는데 jsdom에는 없다. 여기서는 **조회 게이트와 화면 구성**만 고정한다 —
 * QR 이미지와 공유는 실기기 QA 항목이다 (`visit.md` V6).
 */
describe('LobbyPhoneQrPage (V6)', () => {
  beforeEach(() => {
    localStorage.clear()
    server.use(
      http.get(url({ path: RESIDENT_DETAIL_PATH }), () => {
        return HttpResponse.json({ success: MOCK_RESIDENT_DETAIL_INFO })
      }),
    )
  })

  it('제목·동호수·공유 버튼을 보여준다', async () => {
    useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })

    renderWithProviders({ ui: <LobbyPhoneQrPage /> })

    expect(screen.getByText('공동현관 출입 1회용 QR코드')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /QR코드 공유/ })).toBeInTheDocument()
    expect(await screen.findByText(/101동 1001호/)).toBeInTheDocument()
  })

  it('🔴 로비폰을 구독하지 않으면 QR을 조회하지 않는다', async () => {
    useAuthStore.setState({
      aptInfo: { aptResidentUuid: RESIDENT_UUID, contentList: [{ name: '주차' }] },
    })

    let requested = false
    server.use(
      http.get(url({ path: QR_PATH }), () => {
        requested = true
        return HttpResponse.json({ success: 'qr-data' })
      }),
    )

    renderWithProviders({ ui: <LobbyPhoneQrPage /> })
    await screen.findByText(/101동 1001호/)

    expect(requested).toBe(false)
  })

  it('🔴 구독 서비스명에 공백이 섞이면 조회되지 않는다 — `trim`을 하지 않는다', async () => {
    useAuthStore.setState({
      aptInfo: { aptResidentUuid: RESIDENT_UUID, contentList: [{ name: ' 로비폰 ' }] },
    })

    let requested = false
    server.use(
      http.get(url({ path: QR_PATH }), () => {
        requested = true
        return HttpResponse.json({ success: 'qr-data' })
      }),
    )

    renderWithProviders({ ui: <LobbyPhoneQrPage /> })
    await screen.findByText(/101동 1001호/)

    expect(requested).toBe(false)
  })
})
