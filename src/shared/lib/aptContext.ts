import { API_PREFIX } from '@/shared/constants/api'
import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { api } from '@/shared/lib/apiClient'
import type { ServerSuccessBody } from '@/shared/types/api'
import type { AptContentItem, ResidentApt, ResidentDetailInfo } from '@/shared/types/resident'

/**
 * 단지 컨텍스트 조회. **도메인 API가 아니라 하부구조 엔드포인트다** —
 * 12개 도메인이 이 응답의 `contentList`로 메뉴·화면을 게이팅한다.
 *
 * `shared/lib/`에 둔 이유: 이 폴더의 정의가 "바깥과 통신하는 창구"이고
 * (`01-folder-structure.md`), `apiClient`가 재발급 엔드포인트를 직접 부르는 것과 같은
 * 성격이다. 특정 feature가 소유하면 나머지 11개가 그 feature를 import해야 한다.
 */

/** 입주민 상세정보. `aptInfo`와 구독 콘텐츠의 원천이다 */
export const fetchResidentDetailInfo = async ({
  aptResidentUuid,
}: {
  aptResidentUuid: string
}): Promise<ResidentDetailInfo | undefined> => {
  const response = await api.get<ServerSuccessBody<ResidentDetailInfo>>(
    `${API_PREFIX.APARTMANT}/apt-resident/${aptResidentUuid}`,
  )
  return response.data.success
}

/** 입주민이 속한 단지 목록. 로그인 직후 `aptUuid`를 얻고, 전출 시 대체 단지를 고른다 */
export const fetchResidentAptList = async (): Promise<ResidentApt[]> => {
  const response = await api.get<ServerSuccessBody<ResidentApt[]>>(
    `${API_PREFIX.APARTMANT}/apt-resident/apt`,
  )
  return response.data.success ?? []
}

/**
 * 단지가 해당 서비스를 구독했는지. **`trim()`이 필수다** — 서버 값에 공백이 섞여 온다.
 * `contentList`를 직접 `some()`으로 훑지 말고 항상 이 함수를 쓴다.
 */
export const hasAptContent = ({
  contentList,
  contentName,
}: {
  contentList: AptContentItem[] | undefined
  contentName: string
}): boolean => {
  return (
    contentList?.some((content) => {
      return content.name.trim() === contentName
    }) ?? false
  )
}

/**
 * 월패드 알림 UI를 띄울지. 레거시 `useWallPadContent.js`의 `hasWallPadAlarmUI`.
 *
 * 세 서비스 중 **하나라도** 있으면 띄운다 — 정기차량 전용 연동까지 포함한다.
 * (차량 유형별로 갈리는 `hasWallPadUI`는 주차 도메인에서 쓴다. 여기선 알림용만 옮겼다.)
 */
export const hasWallPadAlarmContent = ({
  contentList,
}: {
  contentList: AptContentItem[] | undefined
}): boolean => {
  return (
    hasAptContent({ contentList, contentName: APT_CONTENT_NAME.WALL_PAD }) ||
    hasAptContent({ contentList, contentName: APT_CONTENT_NAME.WALL_PAD_EXTERNAL }) ||
    hasAptContent({ contentList, contentName: APT_CONTENT_NAME.WALL_PAD_EXTERNAL_REGULAR })
  )
}
