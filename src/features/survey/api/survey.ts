import type {
  SurveyDetailInfoData,
  SurveyFormQuestionData,
  SurveyListItemData,
} from '@/features/survey/types/survey'
import { API_PREFIX } from '@/shared/constants/api'
import { api, publicApi } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { InfiniteListFetchParams, PageResponse } from '@/shared/types/infiniteList'

/**
 * 설문조사 API. 레거시 `api/survey.js` 이식.
 *
 * ⚠️ **목록만 회원 전용(`api`)이고 나머지는 전부 `publicApi`다** — 문자로 받은 링크만으로
 * 비회원이 설문에 참여할 수 있어야 한다. 투표와 같은 구조다.
 *
 * ⚠️ **경로에 `survey`가 두 번 들어간다** — `/board/resident/{uuid}/survey`(목록)와
 * `/board/non-resident/survey/respondent/{uuid}/...`(참여 계보)의 규칙이 서로 다르다.
 */
const NON_RESIDENT_PREFIX = '/board/non-resident/survey/respondent'

/**
 * 설문 목록 (SV1). **회원 전용**.
 *
 * ⚠️ **`size`를 서버가 받지 않는다** — 투표와 같다 (SV-Q7).
 * ⚠️ **필터 파라미터 이름이 `state`다** (투표는 `voteStatus`).
 */
export const getSurveyList = async ({
  aptResidentUuid,
  page,
  state,
}: InfiniteListFetchParams): Promise<PageResponse<SurveyListItemData>> => {
  const response = await api.get<ServerSuccessBody<PageResponse<SurveyListItemData>>>(
    `${API_PREFIX.BOARD}/${String(aptResidentUuid)}/survey`,
    { params: { page, state } },
  )

  return response.data.success as PageResponse<SurveyListItemData>
}

/** 설문 상세 (SV2·SV9) */
export const getSurveyDetail = async ({
  participantUuid,
}: {
  participantUuid: string
}): Promise<SurveyDetailInfoData | undefined> => {
  const response = await publicApi.get<ServerSuccessBody<SurveyDetailInfoData>>(
    `${NON_RESIDENT_PREFIX}/${participantUuid}/survey-info`,
  )

  return response.data.success
}

/** 참여 폼 (SV3). **응답이 질문 배열 그 자체**다 — 투표처럼 감싸는 객체가 없다 */
export const getSurveyForm = async ({
  participantUuid,
}: {
  participantUuid: string
}): Promise<SurveyFormQuestionData[]> => {
  const response = await publicApi.get<ServerSuccessBody<SurveyFormQuestionData[]>>(
    `${NON_RESIDENT_PREFIX}/${participantUuid}/question`,
  )

  return response.data.success ?? []
}

/**
 * 설문 제출 (SV3). **JSON이다** — 투표는 서명 파일이 있어 multipart였다.
 *
 * ⚠️ **최상위가 배열 그 자체다** (`{ questionList: [...] }`가 아니다). 서버 계약이다 (SV-Q10).
 * 레거시 인자 이름이 `formData`인데 실제로는 JSON이라 혼동하기 쉽다 — 이름을 바꿔 옮겼다.
 */
export const postSurveyForm = async ({
  participantUuid,
  answerList,
}: {
  participantUuid: string
  answerList: unknown[]
}): Promise<void> => {
  await publicApi.post(`${NON_RESIDENT_PREFIX}/${participantUuid}/answer`, answerList)
}

/** PASS(KMC) 본인인증 결과 전달 (SV5) */
export const patchSurveyCertPass = async ({
  participantUuid,
  apiToken,
  certNum,
}: {
  participantUuid: string
  apiToken: string
  certNum: string
}): Promise<void> => {
  await publicApi.patch(`${NON_RESIDENT_PREFIX}/${participantUuid}/auth/pass`, {
    apiToken,
    certNum,
  })
}

/** 이름·휴대폰 본인인증 (SV6). **하이픈을 떼고 보낸다** */
export const patchSurveyCertNamePhone = async ({
  participantUuid,
  name,
  phone,
}: {
  participantUuid: string
  name: string
  phone: string
}): Promise<void> => {
  await publicApi.patch(`${NON_RESIDENT_PREFIX}/${participantUuid}/auth/name-phone`, {
    name,
    phone: phone.replaceAll('-', ''),
  })
}
