import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { OfficeInfoPage } from '@/features/mypage/pages/OfficeInfoPage'
import { API_PREFIX } from '@/shared/constants/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen } from '@/testing/utils'

const APT_UUID = 'apt-uuid-1'
const contactUrl = url({ path: `${API_PREFIX.APARTMANT}/department/${APT_UUID}` })
const businessHourUrl = url({ path: `${API_PREFIX.APARTMANT}/office/${APT_UUID}` })

describe('OfficeInfoPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      aptInfo: {
        aptResidentUuid: 'resident-uuid-1',
        aptUuid: APT_UUID,
        aptName: '아파트먼트 1단지',
      },
    })
  })

  it('연락처를 전화 링크로, 운영시간을 HH:mm으로 보여준다', async () => {
    server.use(
      http.get(contactUrl, () => {
        return HttpResponse.json({ success: [{ name: '관리사무소', phone: '0212345678' }] })
      }),
      http.get(businessHourUrl, () => {
        return HttpResponse.json({
          success: [
            { uuid: 'h1', dayType: 'MONDAY', startTime: '09:00:00', endTime: '18:00:00' },
            { uuid: 'h2', dayType: 'LUNCH_TIME', startTime: '12:00:00', endTime: '13:00:00' },
          ],
        })
      }),
    )
    renderWithProviders({ ui: <OfficeInfoPage /> })

    expect(await screen.findByText('관리사무소')).toBeInTheDocument()
    // 하이픈은 formatPhone이 넣는다. `tel:`에는 원본이 들어간다
    expect(screen.getByRole('link', { name: /02-1234-5678/ })).toHaveAttribute(
      'href',
      'tel:0212345678',
    )

    expect(await screen.findByText('월요일')).toBeInTheDocument()
    expect(screen.getByText('09:00~18:00')).toBeInTheDocument()
    // 요일 목록에 점심시간이 섞여 온다 — 서버 계약이다
    expect(screen.getByText('점심시간')).toBeInTheDocument()
  })

  it('목록이 비면 각각의 빈 상태 문구를 보여준다', async () => {
    server.use(
      http.get(contactUrl, () => {
        return HttpResponse.json({ success: [] })
      }),
      http.get(businessHourUrl, () => {
        return HttpResponse.json({ success: [] })
      }),
    )
    renderWithProviders({ ui: <OfficeInfoPage /> })

    expect(await screen.findByText('등록된 연락처가 없습니다.')).toBeInTheDocument()
    expect(await screen.findByText('등록된 내용이 없습니다.')).toBeInTheDocument()
  })

  it('단지 로고가 없으면 기본 로고를 보여준다', () => {
    useAuthStore.setState({
      aptInfo: {
        aptResidentUuid: 'resident-uuid-1',
        aptUuid: APT_UUID,
        aptName: '아파트먼트 1단지',
      },
    })
    renderWithProviders({ ui: <OfficeInfoPage /> })

    expect(screen.getByAltText('아파트먼트 기본 로고')).toBeInTheDocument()
  })

  it('단지 로고가 있으면 S3 접두사를 붙여 보여준다', () => {
    useAuthStore.setState({
      aptInfo: {
        aptResidentUuid: 'resident-uuid-1',
        aptUuid: APT_UUID,
        aptName: '아파트먼트 1단지',
        aptLogoFileUrl: '/logo/apt-1.png',
      },
    })
    renderWithProviders({ ui: <OfficeInfoPage /> })

    expect(screen.getByAltText('아파트먼트 1단지 로고')).toHaveAttribute(
      'src',
      'https://file.test.local/logo/apt-1.png',
    )
  })
})
