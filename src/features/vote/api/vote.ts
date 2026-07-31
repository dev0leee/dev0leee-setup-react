import type {
  VoteDetailInfo,
  VoteDetailStatus,
  VoteFormData,
  VoteListItemData,
} from '@/features/vote/types/vote'
import { API_PREFIX } from '@/shared/constants/api'
import { api, publicApi } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { InfiniteListFetchParams, PageResponse } from '@/shared/types/infiniteList'

/**
 * 전자투표 API. 레거시 `api/vote.js` 이식.
 *
 * ⚠️ **인증 인스턴스가 갈린다.** 회원 전용(목록·현황)은 `api`, 투표 참여 계보
 * (상세·폼·제출·인증)는 **`publicApi`**다 — 문자로 받은 링크만으로 비회원이
 * 투표할 수 있어야 해서다. 경로도 `resident`/`non-resident`로 나뉜다.
 */

/** 비회원 경로 접두사. 레거시가 리터럴로 박아둔 것을 상수로만 옮겼다 */
const NON_RESIDENT_PREFIX = '/board/non-resident'

/**
 * 투표 목록 (VT1). **회원 전용**.
 *
 * ⚠️ **`size`를 서버가 받지 않는다.** `useInfiniteList`가 항상 넘기지만 여기서
 * 버린다 — 페이지 크기는 서버 기본값이다 (VT-Q3). 레거시와 같다.
 */
export const getVoteList = async ({
  aptResidentUuid,
  page,
  voteStatus,
}: InfiniteListFetchParams): Promise<PageResponse<VoteListItemData>> => {
  const response = await api.get<ServerSuccessBody<PageResponse<VoteListItemData>>>(
    `${API_PREFIX.BOARD}/vote/${String(aptResidentUuid)}/list`,
    { params: { page, voteStatus } },
  )

  return response.data.success as PageResponse<VoteListItemData>
}

/** 투표 상세 — 정보 (VT2·VT7). **비회원도 조회한다** */
export const getVoteDetailInfo = async ({
  voterUuid,
}: {
  voterUuid: string
}): Promise<VoteDetailInfo | undefined> => {
  const response = await publicApi.get<ServerSuccessBody<VoteDetailInfo>>(
    `${NON_RESIDENT_PREFIX}/voter/${voterUuid}`,
  )

  return response.data.success
}

/** 투표 상세 — 현황 (VT2 `투표 현황` 탭). **회원 전용** */
export const getVoteDetailStatus = async ({
  aptResidentUuid,
  voteUuid,
}: {
  aptResidentUuid: string
  voteUuid: string
}): Promise<VoteDetailStatus | undefined> => {
  const response = await api.get<ServerSuccessBody<VoteDetailStatus>>(
    `${API_PREFIX.BOARD}/vote/${aptResidentUuid}/${voteUuid}/result`,
  )

  return response.data.success
}

/**
 * PASS(KMC) 본인인증 결과 전달 (VT5). **비인증 API**다.
 * KMC가 돌려준 `apiToken`·`certNum`을 그대로 넘긴다.
 */
export const patchVoteCertPass = async ({
  voterUuid,
  apiToken,
  certNum,
}: {
  voterUuid: string
  apiToken: string
  certNum: string
}): Promise<void> => {
  await publicApi.patch(`${NON_RESIDENT_PREFIX}/voter/${voterUuid}/auth/pass`, {
    apiToken,
    certNum,
  })
}

/**
 * 이름·휴대폰 본인인증 (VT6). **비인증 API**다.
 * ⚠️ **하이픈을 떼고 보낸다** — 입력창은 하이픈을 넣어 보여준다.
 */
export const patchVoteCertNamePhone = async ({
  voterUuid,
  name,
  phone,
}: {
  voterUuid: string
  name: string
  phone: string
}): Promise<void> => {
  await publicApi.patch(`${NON_RESIDENT_PREFIX}/voter/${voterUuid}/auth/name-phone`, {
    name,
    phone: phone.replaceAll('-', ''),
  })
}

/** 참여 폼 (VT3). 질문·선택지·최소/최대 선택 수가 온다. **비인증 API**다 */
export const getVoteForm = async ({
  voterUuid,
}: {
  voterUuid: string
}): Promise<VoteFormData | undefined> => {
  const response = await publicApi.get<ServerSuccessBody<VoteFormData>>(
    `${NON_RESIDENT_PREFIX}/voter/${voterUuid}/select`,
  )

  return response.data.success
}

/**
 * 투표 제출 (VT3). **multipart**다 — 서명 이미지가 함께 간다.
 *
 * ⚠️ **요청 필드명이 폼 필드명과 다르다** — 화면은 `optionList`, 요청은 `optionUuidList`다.
 * 인덱스가 박힌 평평한 키(`questionList[0].optionUuidList[1]`)라 서버가 그대로 받는다.
 */
export const postVoteForm = async ({
  voterUuid,
  questionList,
  signFile,
}: {
  voterUuid: string
  questionList: { questionUuid: string; questionType: string; optionList: string[] }[]
  signFile: File
}): Promise<void> => {
  const formData = new FormData()

  questionList.forEach((question, questionIndex) => {
    formData.append(`questionList[${questionIndex}].questionUuid`, question.questionUuid)
    formData.append(`questionList[${questionIndex}].questionType`, question.questionType)
    question.optionList.forEach((optionUuid, optionIndex) => {
      formData.append(`questionList[${questionIndex}].optionUuidList[${optionIndex}]`, optionUuid)
    })
  })

  formData.append('signFile', signFile)

  await publicApi.post(`${NON_RESIDENT_PREFIX}/voter/${voterUuid}`, formData)
}

/**
 * 진행중이면서 내가 아직 안 한 투표가 있는지 (VT10). **회원 전용**.
 * 메인 화면의 미완료 투표 팝업이 이 값 하나로 뜬다.
 */
export const getVoteHasVoterPending = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<{ progressVoteFlag?: boolean } | undefined> => {
  const response = await api.get<ServerSuccessBody<{ progressVoteFlag?: boolean }>>(
    `${API_PREFIX.BOARD}/vote/${aptResidentUuid}/progress-vote`,
  )

  return response.data.success
}
