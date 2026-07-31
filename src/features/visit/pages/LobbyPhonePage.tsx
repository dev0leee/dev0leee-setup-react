import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { VisitPasswordChangeModal } from '@/features/visit/components/VisitPasswordChangeModal'
import {
  FACE_RECOG_CONTENT_NAME,
  GUARD_CALL_DEBOUNCE_MS,
  LOBBY_PHONE_NAV_LIST,
  PASSWORD_MODAL_TITLE,
  SIP_STATE_CHIP,
} from '@/features/visit/constants/visit'
import { useChangeLobbyPhonePassword } from '@/features/visit/queries/useVisitPassword'
import type { LobbyPhoneNavItem } from '@/features/visit/types/visit'
import { ChipBase } from '@/shared/components/common/ChipBase'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { hasAptContent } from '@/shared/lib/aptContext'
import {
  nativeCallLobbyPhoneGuard,
  nativeGetLobbyPhoneSipState,
  subscribeToLobbyPhoneSipState,
} from '@/shared/lib/native/lobbyPhone'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * SIP 연결 상태 (V3 상단). 레거시 `VisitLobbyPhoneListSipState.vue`(54 LOC) 이식.
 *
 * 마운트 시 앱에 상태를 묻고 콜백으로 받는다.
 *
 * ⚠️ **웹 브라우저에서는 콜백이 오지 않아 항상 `정보없음`이다.** 실기기에서만 정상/오류가
 * 갈린다 — 개발 중 이 칩이 주황이라고 고장 난 것이 아니다.
 *
 * ✅ **레거시의 리스너 누수를 고쳤다.** 레거시는 `emitter.on`만 하고 `off`가 없어 V3에
 * 들어갈 때마다 익명 리스너가 쌓였다(제거할 방법도 없었다). `useEffect` cleanup으로
 * 자연히 해소된다. 레거시가 누수를 감추려고 넣어둔 **경로 검사도 필요 없어져 뺐다** —
 * 언마운트되면 구독이 사라지므로 다른 화면에서 콜백이 와도 이 컴포넌트는 반응하지 않는다
 * (`visit.md` §4-1 · V-Q3).
 */
const LobbyPhoneSipState = () => {
  const [isSipOn, setIsSipOn] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const unsubscribe = subscribeToLobbyPhoneSipState({
      handler: (sipState) => {
        setIsSipOn(sipState.isSipActive)
      },
    })

    nativeGetLobbyPhoneSipState()

    return unsubscribe
  }, [])

  const chip =
    isSipOn === undefined
      ? SIP_STATE_CHIP.unknown
      : isSipOn
        ? SIP_STATE_CHIP.on
        : SIP_STATE_CHIP.off

  return (
    <li className="flex w-full items-center justify-between rounded-xl bg-[#00063F] p-4">
      <span className="pretendard-16Regular text-base-b-white">로비폰 통화 연결 상태</span>
      <ChipBase color={chip.chipColor} variant="fill">
        {chip.label}
      </ChipBase>
    </li>
  )
}

/**
 * 경비 호출 (V3). 레거시 `VisitLobbyPhoneListGuardCall.vue`(32 LOC) 이식.
 *
 * ⚠️ **누른 뒤 웹에는 아무 피드백이 없다.** 토스트도 로딩도 없이 앱이 통화를 시작한다.
 * ⚠️ **300ms 디바운스**로 연타를 막는다 — 레거시 `useDebounceFn`과 같은 값이다.
 */
const LobbyPhoneGuardCall = () => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const callGuard = () => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      nativeCallLobbyPhoneGuard()
    }, GUARD_CALL_DEBOUNCE_MS)
  }

  return (
    <li className="w-full">
      <button
        type="button"
        className="relative flex h-[88px] w-full flex-col items-start justify-between rounded-xl bg-defaults-primary-background-primary p-3 px-4 shadow-md"
        onClick={callGuard}
      >
        <span className="pretendard-14Bold">경비 호출</span>
        <img
          className="h-[18px] w-[18px]"
          src="/assets/icons/ArrowNarrowRight.svg"
          alt="화살표 아이콘"
        />
        <img
          className="absolute right-4 bottom-0 h-[67px] w-[67px]"
          src="/assets/icons/Guard.svg"
          alt="경비원 아이콘"
        />
      </button>
    </li>
  )
}

/** 세대 비밀번호 카드 (V3). 클릭하면 공용 변경 모달을 연다 */
const LobbyPhonePasswordCard = () => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const { changeLobbyPhonePassword, isChangeLobbyPhonePasswordPending } =
    useChangeLobbyPhonePassword()

  return (
    <>
      <li className="w-full">
        <button
          type="button"
          className="relative flex h-[88px] w-full flex-col items-start justify-between rounded-xl bg-defaults-primary-background-primary p-3 px-4 shadow-md"
          onClick={() => {
            setIsPasswordModalOpen(true)
          }}
        >
          <span className="pretendard-14Bold">세대 비밀번호</span>
          <img
            className="h-[18px] w-[18px]"
            src="/assets/icons/ArrowNarrowRight.svg"
            alt="화살표 아이콘"
          />
          <img
            className="absolute right-4 bottom-0 h-[74px] w-1/2 max-w-[100px] opacity-[0.11]"
            src="/assets/icons/BackgroundPassword.svg"
            alt="비밀번호 아이콘"
          />
        </button>
      </li>

      <VisitPasswordChangeModal
        open={isPasswordModalOpen}
        title={PASSWORD_MODAL_TITLE.lobbyPhone}
        isPending={isChangeLobbyPhonePasswordPending}
        onSubmit={changeLobbyPhonePassword}
        onClose={() => {
          setIsPasswordModalOpen(false)
        }}
      />
    </>
  )
}

/** 메뉴 항목 1개 (V3). 아이콘 크기가 항목마다 다르다 */
const LobbyPhoneNavItemCard = ({ item }: { item: LobbyPhoneNavItem }) => {
  const navigate = useNavigate()

  return (
    <li className="w-full">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-xl bg-defaults-primary-background-primary p-3 px-4 shadow-md"
        onClick={() => {
          void navigate(item.path)
        }}
      >
        <div className="flex h-full flex-col justify-between gap-2">
          <div className="mr-3 flex flex-col items-start gap-1">
            <span className="pretendard-14Bold">{item.title}</span>
            <p className="text-left pretendard-12Regular text-defaults-secondary-text-secondary">
              {item.description}
            </p>
          </div>
          <img
            className="h-[18px] w-[18px]"
            src="/assets/icons/ArrowNarrowRight.svg"
            alt="화살표 아이콘"
          />
        </div>
        <img className={item.iconClassName} src={item.icon} alt={item.iconAlt} />
      </button>
    </li>
  )
}

/**
 * 로비폰 세대호출 (V3). 레거시 `VisitLobbyPhoneView.vue`(71 LOC) 이식.
 *
 * **이 도메인의 중심축이다** — 임시 비밀번호·QR·안면인식이 전부 여기서 갈라진다.
 *
 * ⚠️ **AppBar를 화면 안에서 그린다**(라우트 meta는 `showAppBar:false`). 우측에 설정
 * 아이콘을 넣고, **뒤로가기를 히스토리가 아니라 항상 `/visit`로 보내기 위해서**다 —
 * 메인 메뉴에서 바로 들어와도 뒤로가기는 V1로 간다. 의도된 동작이다.
 *
 * ⚠️ **안면인식 메뉴만 구독 여부로 걸러진다.** 나머지 둘은 이 화면에 들어온 시점에
 * 이미 `로비폰` 구독이 확인됐다고 보고 검사하지 않는다(레거시 주석).
 */
export const LobbyPhonePage = () => {
  const navigate = useNavigate()

  const contentList = useAuthStore((state) => {
    return state.aptInfo.contentList
  })

  const hasFaceRecogContent = hasAptContent({
    contentList,
    contentName: FACE_RECOG_CONTENT_NAME,
  })

  const lobbyPhoneNavList = LOBBY_PHONE_NAV_LIST.filter((item) => {
    if (item.key === 'faceRegister') return hasFaceRecogContent
    return true
  })

  return (
    <div className="h-full w-full">
      <AppBar
        title="로비폰 세대호출"
        className="bg-defaults-secondary-background-secondary"
        onBack={() => {
          void navigate(ROUTE_PATH.VISIT)
        }}
      >
        <button
          type="button"
          onClick={() => {
            void navigate(ROUTE_PATH.MYPAGE_ALARM_SETTING)
          }}
        >
          <img src="/assets/icons/SettingsBlack.svg" alt="설정 아이콘" />
        </button>
      </AppBar>

      <div className="flex h-full w-full flex-col items-start overflow-auto bg-defaults-secondary-background-secondary pt-12">
        <ul className="flex w-full flex-col items-start gap-3 p-6">
          <LobbyPhoneSipState />
          <div className="flex w-full gap-3">
            <LobbyPhoneGuardCall />
            <LobbyPhonePasswordCard />
          </div>
          {lobbyPhoneNavList.map((item) => {
            return <LobbyPhoneNavItemCard key={item.key} item={item} />
          })}
        </ul>
      </div>
    </div>
  )
}
