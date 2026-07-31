import type { VoteDetailInfo, VoteDetailStatus, VoteListItemData } from '@/features/vote/types/vote'
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
