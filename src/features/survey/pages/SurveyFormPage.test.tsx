import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { SurveyCertNamePhonePage } from '@/features/survey/pages/SurveyCertNamePhonePage'
import { SurveyCompletedPage } from '@/features/survey/pages/SurveyCompletedPage'
import { SurveyFormPage } from '@/features/survey/pages/SurveyFormPage'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { STORAGE_KEY } from '@/shared/constants/storage'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { useSurveyCertStore } from '@/shared/stores/surveyCertStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const SURVEY_UUID = 'survey-uuid-1'
const PARTICIPANT_UUID = 'participant-uuid-1'

const FORM_PATH = `/board/non-resident/survey/respondent/${PARTICIPANT_UUID}/question`
const ANSWER_PATH = `/board/non-resident/survey/respondent/${PARTICIPANT_UUID}/answer`
const NAME_PHONE_PATH = `/board/non-resident/survey/respondent/${PARTICIPANT_UUID}/auth/name-phone`

const SINGLE_QUESTION = {
  uuid: 'q1',
  content: '주차장을 얼마나 이용하시나요?',
  type: 'SINGLE_CHOICE',
  requiredFlag: true,
  optionList: [
    { uuid: 'o1', content: '매일', type: 'CHOICE' },
    { uuid: 'o2', content: '기타', type: 'SUBJECTIVE' },
  ],
  etcFlag: true,
}

const SUBJECTIVE_QUESTION = {
  uuid: 'q2',
  content: '개선점을 자유롭게 적어주세요',
  type: 'SUBJECTIVE',
  requiredFlag: false,
}

const MULTIPLE_QUESTION = {
  uuid: 'q3',
  content: '필요한 시설은?',
  type: 'MULTIPLE_CHOICE',
  requiredFlag: true,
  minChoice: 2,
  maxChoice: 3,
  optionList: [
    { uuid: 'm1', content: '헬스장', type: 'CHOICE' },
    { uuid: 'm2', content: '독서실', type: 'CHOICE' },
    { uuid: 'm3', content: '카페', type: 'CHOICE' },
    { uuid: 'm4', content: '수영장', type: 'CHOICE' },
  ],
}

const useForm = (questions: unknown[]) => {
  server.use(
    http.get(url({ path: FORM_PATH }), () => {
      return HttpResponse.json({ success: questions })
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  useErrorModalStore.setState({ current: null })
  useSurveyCertStore.setState({
    surveyCertInfo: { surveyUuid: SURVEY_UUID, participantUuid: PARTICIPANT_UUID },
  })
  localStorage.setItem(
    STORAGE_KEY.SURVEY_CERT_INFO,
    JSON.stringify({ surveyUuid: SURVEY_UUID, participantUuid: PARTICIPANT_UUID }),
  )
})

const renderPage = ({ auth = true } = {}) => {
  return renderWithProviders({
    initialEntries: [
      { pathname: `/survey/form/${PARTICIPANT_UUID}`, state: auth ? { auth: true } : null },
    ],
    ui: (
      <Routes>
        <Route path={ROUTE_PATH.SURVEY_FORM} element={<SurveyFormPage />} />
        <Route path={ROUTE_PATH.SURVEY_COMPLETED} element={<SurveyCompletedPage />} />
        <Route path={ROUTE_PATH.SURVEY_DETAIL} element={<h1>상세 화면</h1>} />
        <Route path={ROUTE_PATH.MAIN} element={<h1>메인</h1>} />
      </Routes>
    ),
  })
}

describe('SurveyFormPage (SV3)', () => {
  it('유형 3종을 라디오·체크박스·textarea로 그린다', async () => {
    useForm([SINGLE_QUESTION, SUBJECTIVE_QUESTION, MULTIPLE_QUESTION])

    renderPage()

    expect(await screen.findByText('주차장을 얼마나 이용하시나요?')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
    expect(screen.getByPlaceholderText('답변을 입력해주세요')).toBeInTheDocument()
  })

  it('필수 질문에만 `*`가 붙고 상단에 안내가 있다', async () => {
    useForm([SINGLE_QUESTION, SUBJECTIVE_QUESTION])

    renderPage()

    expect(await screen.findByText('* 표시는 필수 질문임')).toBeInTheDocument()
    // 필수는 1개(SINGLE_QUESTION)뿐이다
    expect(screen.getAllByText('*')).toHaveLength(1)
  })

  it('🔴 서술형 글자 수가 처음에 **`/200`**으로 보인다 (`0/200`이 아니다)', async () => {
    useForm([SUBJECTIVE_QUESTION])

    renderPage()

    expect(await screen.findByText('/200')).toBeInTheDocument()
  })

  it('서술형에 입력하면 글자 수가 센다', async () => {
    useForm([SUBJECTIVE_QUESTION])

    renderPage()
    await userEvent.type(await screen.findByPlaceholderText('답변을 입력해주세요'), '좋아요')

    expect(screen.getByText('3/200')).toBeInTheDocument()
  })

  it('필수 단일 선택을 비우고 제출하면 `옵션을 선택해주세요`가 뜬다', async () => {
    useForm([SINGLE_QUESTION])

    renderPage()
    await screen.findByText('주차장을 얼마나 이용하시나요?')
    await userEvent.click(screen.getByRole('button', { name: '제출하기' }))

    expect(await screen.findByText('옵션을 선택해주세요')).toBeInTheDocument()
  })

  it('✅ **기타 옵션을 고르면 인라인 입력이 열린다**', async () => {
    useForm([SINGLE_QUESTION])

    renderPage()
    await screen.findByText('주차장을 얼마나 이용하시나요?')

    expect(screen.queryByPlaceholderText('답변을 입력해주세요')).not.toBeInTheDocument()

    await userEvent.click(screen.getAllByRole('radio')[1] as HTMLElement)

    expect(screen.getByPlaceholderText('답변을 입력해주세요')).toBeInTheDocument()
  })

  it('기타를 고르고 입력을 비우면 `기타 답변을 입력해주세요`가 뜬다', async () => {
    useForm([SINGLE_QUESTION])

    renderPage()
    await screen.findByText('주차장을 얼마나 이용하시나요?')
    await userEvent.click(screen.getAllByRole('radio')[1] as HTMLElement)
    await userEvent.click(screen.getByRole('button', { name: '제출하기' }))

    expect(await screen.findByText('기타 답변을 입력해주세요')).toBeInTheDocument()
  })

  it('복수 선택의 최소 개수를 못 채우면 막힌다', async () => {
    useForm([MULTIPLE_QUESTION])

    renderPage()
    await screen.findByText('필요한 시설은?')
    await userEvent.click(screen.getAllByRole('checkbox')[0] as HTMLElement)
    await userEvent.click(screen.getByRole('button', { name: '제출하기' }))

    expect(await screen.findByText('최소 2개를 선택해주세요')).toBeInTheDocument()
  })

  it('⚠️ **비필수 + 미응답 질문은 제출에서 빠진다**', async () => {
    useForm([SINGLE_QUESTION, SUBJECTIVE_QUESTION])

    let body: unknown[] = []
    server.use(
      http.post(url({ path: ANSWER_PATH }), async ({ request }) => {
        body = (await request.json()) as unknown[]
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await screen.findByText('주차장을 얼마나 이용하시나요?')
    await userEvent.click(screen.getAllByRole('radio')[0] as HTMLElement)
    await userEvent.click(screen.getByRole('button', { name: '제출하기' }))

    expect(await screen.findByText('설문이 완료되었습니다.')).toBeInTheDocument()
    // 서술형(비필수·미응답)은 빠지고 선택형 하나만 간다
    expect(body).toEqual([{ questionUuid: 'q1', optionList: [{ uuid: 'o1' }] }])
  })

  it('기타 답변은 **선택지에 `subjectiveAnswer`로** 실린다', async () => {
    useForm([SINGLE_QUESTION])

    let body: unknown[] = []
    server.use(
      http.post(url({ path: ANSWER_PATH }), async ({ request }) => {
        body = (await request.json()) as unknown[]
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await screen.findByText('주차장을 얼마나 이용하시나요?')
    await userEvent.click(screen.getAllByRole('radio')[1] as HTMLElement)
    await userEvent.type(screen.getByPlaceholderText('답변을 입력해주세요'), '가끔')
    await userEvent.click(screen.getByRole('button', { name: '제출하기' }))

    await waitFor(() => {
      expect(body).toEqual([
        { questionUuid: 'q1', optionList: [{ uuid: 'o2', subjectiveAnswer: '가끔' }] },
      ])
    })
  })

  it('⚠️ 직접 진입하면 접근 금지 모달이 뜨고 닫으면 메인으로 간다', async () => {
    useForm([SINGLE_QUESTION])

    renderPage({ auth: false })

    expect(screen.getByText('잘못된 접근입니다')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '확인' }))

    expect(await screen.findByRole('heading', { name: '메인' })).toBeInTheDocument()
  })
})

describe('SurveyCertNamePhonePage (SV6)', () => {
  const renderCertPage = () => {
    return renderWithProviders({
      initialEntries: [
        {
          pathname: ROUTE_PATH.SURVEY_CERT_NAME_PHONE,
          state: { auth: true, dong: '101', ho: '1001' },
        },
      ],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.SURVEY_CERT_NAME_PHONE} element={<SurveyCertNamePhonePage />} />
          <Route path={ROUTE_PATH.SURVEY_FORM} element={<h1>참여 폼</h1>} />
          <Route path={ROUTE_PATH.SURVEY_LIST} element={<h1>목록 화면</h1>} />
          <Route path={ROUTE_PATH.SURVEY_DETAIL} element={<h1>상세 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('✅ **휴대폰 검증 에러가 뜬다** (투표는 안 뜬다)', async () => {
    renderCertPage()

    await userEvent.type(screen.getByPlaceholderText('휴대폰 번호(- 없이 숫자만 입력)'), '123')

    expect(await screen.findByText('휴대폰 번호 형식으로 - 없이 입력해주세요')).toBeInTheDocument()
  })

  it('⚠️ 소제목이 **`투표자 정보`**다 (설문인데 투표 문구)', () => {
    renderCertPage()

    expect(screen.getByText('투표자 정보')).toBeInTheDocument()
  })

  it('인증에 성공하면 하이픈을 떼고 보내고 참여 폼으로 간다', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.patch(url({ path: NAME_PHONE_PATH }), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderCertPage()
    await userEvent.type(screen.getByPlaceholderText('이름 입력'), '홍길동')
    await userEvent.type(
      screen.getByPlaceholderText('휴대폰 번호(- 없이 숫자만 입력)'),
      '01012345678',
    )
    await userEvent.click(screen.getByRole('button', { name: '완료' }))

    expect(await screen.findByRole('heading', { name: '참여 폼' })).toBeInTheDocument()
    expect(body).toEqual({ name: '홍길동', phone: '01012345678' })
  })

  it('⚠️ `SURVEY_RESPONDENT_MISS_MATCH`는 모달만 띄우고 화면에 남는다', async () => {
    server.use(
      http.patch(url({ path: NAME_PHONE_PATH }), () => {
        return HttpResponse.json(
          {
            error: {
              errorCode: 'SURVEY_RESPONDENT_MISS_MATCH',
              message: '응답자 정보가 일치하지 않습니다',
            },
          },
          { status: 400 },
        )
      }),
    )

    renderCertPage()
    await userEvent.type(screen.getByPlaceholderText('이름 입력'), '홍길동')
    await userEvent.type(
      screen.getByPlaceholderText('휴대폰 번호(- 없이 숫자만 입력)'),
      '01012345678',
    )
    await userEvent.click(screen.getByRole('button', { name: '완료' }))

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe('응답자 정보가 일치하지 않습니다')
    })
    expect(useErrorModalStore.getState().current?.callback).toBeUndefined()
  })
})
