import { http, HttpResponse } from 'msw'

import { env } from '@/config/env'
import { API_PREFIX } from '@/shared/constants/api'

/**
 * axios의 baseURL 조합과 동일하게 단순 이어붙인다.
 * `new URL('/login', 'http://host/api')`는 `/api`를 버리고 `http://host/login`이 되므로 쓰면 안 된다.
 */
export const url = ({ path }: { path: string }) => {
  return `${env.VITE_API_URL.replace(/\/$/, '')}${path}`
}

/** 로그인 성공 시 서버가 헤더로 내려주는 토큰 */
export const MOCK_TOKENS = {
  ACCESS: 'mock-access-token',
  REFRESH: 'mock-refresh-token',
} as const

/** 입주민 상세정보. 구독 콘텐츠가 메뉴·알림 그룹 노출을 결정한다 */
export const MOCK_RESIDENT_DETAIL_INFO = {
  aptId: 'APT-1',
  aptName: '아파트먼트 1단지',
  aptLogoFileUrl: '/logo/apt-1.png',
  residentId: 'resident-1',
  dong: '101',
  ho: '1001',
  oldApartmantToken: 'community-token',
  contentList: [{ name: '주차' }, { name: 'A-PASS' }, { name: '소통' }, { name: '민원' }],
  apassUseFlag: true,
  apassOnOffFlag: false,
}

export const MOCK_LOGIN_INFO = {
  uuid: 'resident-uuid-1',
  aptName: '아파트먼트 1단지',
  aptId: 'APT-1',
  name: '홍길동',
  nickName: '길동',
  oldApartmantToken: 'community-token',
  aptLogoFileUrl: 'https://statics.test.local/logo.png',
  contentList: [{ name: 'A-PASS' }, { name: ' 로비폰 ' }],
  apassUseFlag: true,
  apassOnOffFlag: false,
}

/**
 * 기본 핸들러. 테스트마다 다른 응답이 필요하면 `server.use()`로 덮는다.
 * 여기 있는 것은 **정상 경로**만이다 — 에러 경로를 기본값으로 두면 무엇을 검증하는지
 * 읽기 어려워진다.
 */
export const handlers = [
  http.post(url({ path: `${API_PREFIX.APARTMANT}/login` }), () => {
    return HttpResponse.json(
      { success: { oldResidentFlag: false } },
      {
        headers: {
          authorization: MOCK_TOKENS.ACCESS,
          'refresh-token': MOCK_TOKENS.REFRESH,
        },
      },
    )
  }),

  http.get(url({ path: `${API_PREFIX.APARTMANT}/login/info` }), () => {
    return HttpResponse.json({ success: MOCK_LOGIN_INFO })
  }),

  http.get(url({ path: `${API_PREFIX.APARTMANT}/apt-resident/apt` }), () => {
    return HttpResponse.json({
      success: [{ aptResidentUuid: MOCK_LOGIN_INFO.uuid, aptUuid: 'apt-uuid-1' }],
    })
  }),

  http.get(url({ path: `${API_PREFIX.APARTMANT}/apt-resident/:uuid` }), () => {
    return HttpResponse.json({ success: MOCK_RESIDENT_DETAIL_INFO })
  }),

  http.delete(url({ path: `${API_PREFIX.APARTMANT}/logout` }), () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(url({ path: `${API_PREFIX.APARTMANT}/token-refresh` }), () => {
    return HttpResponse.json({}, { headers: { authorization: 'refreshed-access-token' } })
  }),
]
