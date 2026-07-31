import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SurveyDetailPage } from '@/features/survey/pages/SurveyDetailPage'
import { SurveyListPage } from '@/features/survey/pages/SurveyListPage'
import { API_PREFIX } from '@/shared/constants/api'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { useSurveyCertStore } from '@/shared/stores/surveyCertStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const SURVEY_UUID = 'survey-uuid-1'
const PARTICIPANT_UUID = 'participant-uuid-1'

const LIST_PATH = `${API_PREFIX.BOARD}/${RESIDENT_UUID}/survey`
const DETAIL_PATH = `/board/non-resident/survey/respondent/${PARTICIPANT_UUID}/survey-info`

const LIST_ITEM = {
  surveyUuid: SURVEY_UUID,
  participantUuid: PARTICIPANT_UUID,
  state: 'PROGRESS',
  groupName: '입주자대표회의',
  title: '커뮤니티 시설 만족도 조사',
  respondentState: 'PENDING',
  startDateTime: '2026-07-29T09:00:00',
  endDateTime: '2026-08-05T18:00:00',
}

const DETAIL_INFO = {
  surveyUuid: SURVEY_UUID,
  participantUuid: PARTICIPANT_UUID,
  state: 'PROGRESS',
  respondentState: 'PENDING',
  groupName: '입주자대표회의',
  title: '커뮤니티 시설 만족도 조사',
  content: '상세 내용입니다',
  startDateTime: '2026-07-29T09:00:00',
  endDateTime: '2026-08-05T18:00:00',
  authFlag: false,
  authType: 'NAME_PHONE',
  dong: '101',
  ho: '1001',
}

const page = (content: unknown[]) => {
  return {
    content,
    number: 0,
    totalPages: 1,
    totalElements: content.length,
    last: true,
    empty: content.length === 0,
    numberOfElements: content.length,
  }
}

const useList = (content: unknown[]) => {
  server.use(
    http.get(url({ path: LIST_PATH }), () => {
      return HttpResponse.json({ success: page(content) })
    }),
  )
}

const useDetail = (info: unknown) => {
  server.use(
    http.get(url({ path: DETAIL_PATH }), () => {
      return HttpResponse.json({ success: info })
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  useErrorModalStore.setState({ current: null })
  useSurveyCertStore.setState({ surveyCertInfo: {} })
})

describe('SurveyListPage (SV1)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.SURVEY_LIST],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.SURVEY_LIST} element={<SurveyListPage />} />
          <Route path={ROUTE_PATH.SURVEY_DETAIL} element={<h1>상세 화면</h1>} />
          <Route path={ROUTE_PATH.MAIN} element={<h1>메인</h1>} />
        </Routes>
      ),
    })
  }

  it('카드에 상태 칩·제목·필드 3줄을 보여준다', async () => {
    useList([LIST_ITEM])

    renderPage()

    expect(await screen.findByText('커뮤니티 시설 만족도 조사')).toBeInTheDocument()
    expect(screen.getByText('미완료')).toBeInTheDocument()
    expect(screen.getByText('2026-07-29 09:00')).toBeInTheDocument()
    expect(screen.getByText('2026-08-05 18:00')).toBeInTheDocument()
    // ⚠️ 투표 카드에 있는 `유형` 줄이 설문에는 없다
    expect(screen.queryByText('유형')).not.toBeInTheDocument()
  })

  it('✅ 시작 전이면 **D-day가 보인다** (투표 목록은 안 보인다)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 6, 26, 12, 0, 0))

    useList([{ ...LIST_ITEM, state: 'PENDING' }])

    renderPage()

    expect(await screen.findByText('D-3')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('필터를 바꾸면 **`state`** 파라미터를 실어 다시 조회한다', async () => {
    const requested: (string | null)[] = []
    server.use(
      http.get(url({ path: LIST_PATH }), ({ request }) => {
        requested.push(new URL(request.url).searchParams.get('state'))
        return HttpResponse.json({ success: page([LIST_ITEM]) })
      }),
    )

    renderPage()
    await screen.findByText('커뮤니티 시설 만족도 조사')

    await userEvent.click(screen.getByText('종료'))

    await waitFor(() => {
      expect(requested).toContain('CLOSE')
    })
    expect(requested[0]).toBeNull()
  })

  it('카드를 누르면 상세로 간다', async () => {
    useList([LIST_ITEM])

    renderPage()
    await userEvent.click(await screen.findByText('커뮤니티 시설 만족도 조사'))

    expect(await screen.findByRole('heading', { name: '상세 화면' })).toBeInTheDocument()
  })

  it('0건이면 빈 문구가 뜬다', async () => {
    useList([])

    renderPage()

    expect(await screen.findByText('등록된 설문이 없습니다')).toBeInTheDocument()
  })
})

describe('SurveyDetailPage (SV2)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [`/survey/detail/${SURVEY_UUID}/${PARTICIPANT_UUID}`],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.SURVEY_DETAIL} element={<SurveyDetailPage />} />
          <Route path={ROUTE_PATH.SURVEY_LIST} element={<h1>목록 화면</h1>} />
          <Route path={ROUTE_PATH.SURVEY_FORM} element={<h1>참여 폼</h1>} />
          <Route path={ROUTE_PATH.SURVEY_CERT_NAME_PHONE} element={<h1>이름 휴대폰 인증</h1>} />
          <Route path={ROUTE_PATH.ERROR} element={<h1>에러 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('제목·그룹명·기간을 보여준다', async () => {
    useDetail(DETAIL_INFO)

    renderPage()

    expect(await screen.findByText('커뮤니티 시설 만족도 조사')).toBeInTheDocument()
    expect(screen.getByText('입주자대표회의')).toBeInTheDocument()
    // ⚠️ 투표와 달리 **분까지만** 보여준다
    expect(screen.getByText('2026-07-29 09:00 ~ 2026-08-05 18:00')).toBeInTheDocument()
  })

  it('⚠️ 탭이 없다 (투표 상세와 다르다)', async () => {
    useDetail(DETAIL_INFO)

    renderPage()

    await screen.findByText('커뮤니티 시설 만족도 조사')
    expect(screen.queryByText('설문 현황')).not.toBeInTheDocument()
    expect(screen.getByText('설문 기본정보')).toBeInTheDocument()
  })

  it('진입 시 인증 정보를 저장한다', async () => {
    useDetail(DETAIL_INFO)

    renderPage()
    await screen.findByText('커뮤니티 시설 만족도 조사')

    expect(JSON.parse(localStorage.getItem('surveyCertInfo') ?? '{}')).toEqual({
      surveyUuid: SURVEY_UUID,
      participantUuid: PARTICIPANT_UUID,
    })
  })

  it('하단 버튼 — 시작 전이면 `오픈`이 비활성이다', async () => {
    useDetail({ ...DETAIL_INFO, state: 'PENDING' })

    renderPage()

    const button = await screen.findByRole('button', { name: /오픈/ })
    expect(button).toBeDisabled()
    // ⚠️ 버튼만 초까지 보여준다 (기본정보는 분까지)
    expect(button).toHaveTextContent('2026-07-29 09:00:00')
  })

  it('하단 버튼 — 참여를 마쳤으면 `참여완료`가 비활성이다', async () => {
    useDetail({ ...DETAIL_INFO, respondentState: 'PARTICIPATED' })

    renderPage()

    expect(await screen.findByRole('button', { name: '참여완료' })).toBeDisabled()
  })

  it('하단 버튼 — ✅ **인증이 필요 없는 설문(`NONE`)은 바로 참여**한다', async () => {
    useDetail({ ...DETAIL_INFO, authType: 'NONE' })

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '참여하기' }))

    expect(await screen.findByRole('heading', { name: '참여 폼' })).toBeInTheDocument()
  })

  it('하단 버튼 — 인증을 마쳤으면 참여 폼으로 간다', async () => {
    useDetail({ ...DETAIL_INFO, authFlag: true })

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '참여하기' }))

    expect(await screen.findByRole('heading', { name: '참여 폼' })).toBeInTheDocument()
  })

  it('하단 버튼 — `NAME_PHONE`이면 인증 화면으로 간다', async () => {
    useDetail(DETAIL_INFO)

    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: '참여하기' }))

    expect(await screen.findByRole('heading', { name: '이름 휴대폰 인증' })).toBeInTheDocument()
  })

  it('하단 버튼 — `PASS`면 KMC 폼이 뜨고, **설문불참이면 잠긴다**', async () => {
    useDetail({ ...DETAIL_INFO, authType: 'PASS', respondentState: 'NOT_PARTICIPATED' })

    renderPage()

    await waitFor(() => {
      expect(document.querySelector('form[name="reqKMCISForm"]')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: '참여하기' })).toBeDisabled()
  })

  it('⚠️ `SURVEY_RESPONDENT_NOT_FOUND`면 목록으로 보낸 뒤 모달을 띄운다', async () => {
    server.use(
      http.get(url({ path: DETAIL_PATH }), () => {
        return HttpResponse.json(
          {
            error: {
              errorCode: 'SURVEY_RESPONDENT_NOT_FOUND',
              message: '응답자를 찾을 수 없습니다',
            },
          },
          { status: 400 },
        )
      }),
    )

    renderPage()

    expect(await screen.findByRole('heading', { name: '목록 화면' })).toBeInTheDocument()
    expect(useErrorModalStore.getState().current?.text).toBe('응답자를 찾을 수 없습니다')
  })
})
