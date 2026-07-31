import { useNavigate } from 'react-router-dom'

import { ROUTE_PATH } from '@/shared/constants/routes'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'

/**
 * 방문자 출입관리 허브 (V1). 레거시 `VisitListView.vue`(17 LOC) 이식.
 *
 * **메인의 방문 출입관리 카드가 유일한 진입점이다.**
 *
 * ⚠️ **구독한 서비스가 하나도 없으면 빈 화면이다.** 안내 문구가 없다 (`deferred.md`).
 *
 * ⚠️ 레거시는 `<div>` 안에 `<li>`를 직접 넣는다(`<ul>` 없음). HTML 규격 위반이지만
 * 그대로 옮겼다 — 카드가 목록 항목처럼 보이는 마크업이다.
 */
export const VisitListPage = () => {
  const navigate = useNavigate()
  const { hasLobbyPhone, hasAptVisitorPassContent } = useResidentDetailInfo()

  return (
    <div className="h-full w-full space-y-3 bg-defaults-secondary-background-mono p-6">
      {hasLobbyPhone && (
        <li className="w-full">
          <button
            type="button"
            className="relative flex h-[117px] w-full flex-col items-end justify-between overflow-hidden rounded-xl bg-[#00063F] p-[18px] shadow-md"
            onClick={() => {
              void navigate(ROUTE_PATH.VISIT_LOBBY_PHONE)
            }}
          >
            <div className="flex h-full flex-col items-start justify-between gap-[3px] self-stretch">
              <span className="pretendard-16Bold text-base-b-white"> 로비폰 </span>
              <p className="pretendard-14SemiBold text-base-b-white/80">
                세대호출 통화 연결 및 문열기
              </p>
            </div>
            <img
              src="/assets/icons/LobbyPhone.svg"
              alt="로비폰 아이콘"
              className="absolute right-6 bottom-[0px] h-[85px] w-[85px]"
            />
          </button>
        </li>
      )}

      {hasAptVisitorPassContent && (
        <li className="w-full">
          <button
            type="button"
            // ⚠️ 레거시의 `bg-deep-blue`는 CSS가 생성되지 않아 무효였다 — 옮기지 않았다
            className="relative flex h-[117px] w-full flex-col items-end justify-between overflow-hidden rounded-xl border border-defaults-tertiary-border-tertiary bg-defaults-primary-background-primary p-[18px] shadow-md"
            onClick={() => {
              void navigate(ROUTE_PATH.VISIT_KIOSK_PASSWORD)
            }}
          >
            <div className="flex flex-col items-start gap-[3px] self-stretch">
              <span className="pretendard-16Bold">방문증 키오스크 비밀번호</span>
            </div>
            {/* ⚠️ 장식 이미지인데 alt가 제목과 같다 — 스크린리더가 두 번 읽는다 (레거시 그대로) */}
            <img
              src="/assets/icons/BackgroundPassword.svg"
              alt="방문증 키오스크 비밀번호"
              className="absolute right-6 bottom-[-6.5px] h-[103px] w-[103px] opacity-[0.11]"
            />
            <div className="flex items-center gap-2 self-stretch">
              <span className="pretendard-14SemiBold text-defaults-secondary-text-secondary">
                패스워드 확인 및 변경
              </span>
              {/*
                ⚠️ 레거시는 `w-4.75 h-4.75`인데 **CSS가 생성되지 않아 SVG 고유 크기로**
                렌더된다. `w-[19px]`로 고치면 크기가 달라지므로 클래스를 빼서 같은 결과로 뒀다
                (`broken-styles.md` §3).
              */}
              <img src="/assets/icons/ArrowNarrowRight.svg" alt="화살표 아이콘" />
            </div>
          </button>
        </li>
      )}
    </div>
  )
}
