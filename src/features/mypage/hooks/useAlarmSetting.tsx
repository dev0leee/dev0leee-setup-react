import {
  ALARM_FLAG_KEY,
  ALARM_GROUP_TITLE,
  ALARM_INFO,
  ALARM_LABEL,
  CONSENT_DATE_KEY,
  CONSENT_DATE_LENGTH,
} from '@/features/mypage/constants/mypage'
import {
  useExternalPushAlarm,
  useLobbyPhonePushAlarm,
  useMarketingConsent,
  useRegularPushAlarm,
  useWallPadAlarm,
} from '@/features/mypage/queries/useAlarmMutations'
import { useNotificationSetting } from '@/features/mypage/queries/useNotificationSetting'
import type {
  AlarmSettingGroup,
  ConsentType,
  NotificationSetting,
} from '@/features/mypage/types/mypage'
import { MARKETING_TERMS_ITEMS, TERMS_ID } from '@/shared/constants/terms'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import { showToast } from '@/shared/lib/toast'

/**
 * 알림 설정 화면의 조립. 레거시 `lib/composables/useAlarmSetting.js`(272 LOC) 이식.
 *
 * 훅 8개를 묶어 그룹 4개를 만든다. 화면은 이 결과만 그린다.
 *
 * 확장자가 `.tsx`인 이유: 동의 토스트 문구가 **두 줄**이라 `<br />`을 담은
 * `ReactNode`를 만들어야 한다 (레거시가 `v-dompurify-html`로 렌더한 자리다).
 * 문자열로는 표현할 수 없다.
 */

/**
 * 표시할 값을 고른다. **mutation 응답이 통합 조회값을 이긴다** (`mypage.md` P4).
 *
 * 낙관적 업데이트도, 성공 후 무효화도 하지 않는다 — 서버가 변경 결과를 응답에 담아
 * 주므로 그 값을 그대로 쓴다. 재조회 한 번을 아끼는 대신, **화면을 떠나면 응답이
 * 사라져 다음 진입 때 다시 조회값을 본다.** 레거시 동작이라 유지한다.
 *
 * ⚠️ `!= null`이 의도적이다. `false`는 유효한 값이므로 truthy 검사를 쓰면
 * "끈 직후 다시 켜진 것처럼" 보인다.
 */
const pickFlag = <K extends keyof NotificationSetting>({
  key,
  mutationResult,
  notificationSetting,
}: {
  key: K
  mutationResult: NotificationSetting | undefined
  notificationSetting: NotificationSetting | undefined
}): NotificationSetting[K] => {
  const mutationValue = mutationResult?.[key]
  if (mutationValue != null) return mutationValue

  return notificationSetting?.[key]
}

export const useAlarmSetting = () => {
  const { hasAptParkingContent, hasLobbyPhone, hasWallPadAlarmUI, isResidentDetailInfoLoading } =
    useResidentDetailInfo()

  const { notificationSetting, isNotificationSettingLoading } = useNotificationSetting()

  const { regularPushResult, mutateRegularPush, isRegularPushPending } = useRegularPushAlarm()
  const { externalPushResult, mutateExternalPush, isExternalPushPending } = useExternalPushAlarm()
  const { wallPadResult, mutateWallPad, isWallPadPending } = useWallPadAlarm()
  const { lobbyPhonePushAlarmState, mutateLobbyPhonePushAlarm, isLobbyPhonePushAlarmPending } =
    useLobbyPhonePushAlarm({ enabled: hasLobbyPhone })
  const { marketingConsentResult, mutateMarketingConsent, isMarketingConsentPending } =
    useMarketingConsent()

  const marketingFlag = pickFlag({
    key: ALARM_FLAG_KEY.MARKETING_CONSENT,
    mutationResult: marketingConsentResult,
    notificationSetting,
  })
  const advertsFlag = pickFlag({
    key: ALARM_FLAG_KEY.RECEIVE_ADVERTS_CONSENT,
    mutationResult: marketingConsentResult,
    notificationSetting,
  })

  /**
   * 마케팅 ↔ 광고성 양방향 연동. 레거시 `changeTermsState`.
   *
   * | 토글   | 값    | 결과                                    |
   * | ------ | ----- | --------------------------------------- |
   * | 마케팅 | true  | 마케팅 true, 광고성은 기존값 유지        |
   * | 마케팅 | false | **둘 다 false**                          |
   * | 광고성 | true  | 광고성 true, **마케팅도 true**            |
   * | 광고성 | false | 광고성 false, 마케팅은 기존값 유지        |
   *
   * 마지막 `if (!nextMarketing)`이 "마케팅이 꺼지면 광고성도 끈다"를 보장한다 —
   * 광고성만 켜져 있는 상태를 서버가 허용하지 않기 때문이다.
   *
   * **응답을 그대로 돌려준다.** 토스트가 변경 후 일시를 보여줘야 하는데, 이 함수를
   * 부른 핸들러는 이미 만들어진 클로저라 재렌더된 `marketingConsentResult`를 볼 수 없다
   * (Vue는 `ref`를 읽어서 문제가 없었다). 응답을 인자로 넘기는 것이 유일하게 안전하다.
   */
  const changeConsent = async ({ type, value }: { type: ConsentType; value: boolean }) => {
    const isMarketing = type === 'MARKETING'

    const nextMarketing = isMarketing ? value : value || (marketingFlag ?? false)
    const nextAdverts = isMarketing ? (advertsFlag ?? false) : value

    // 마케팅이 꺼지면 광고성도 함께 끈다
    const payload = nextMarketing
      ? { marketingDataConsentFlag: nextMarketing, receiveAdvertsConsentFlag: nextAdverts }
      : { marketingDataConsentFlag: false, receiveAdvertsConsentFlag: false }

    try {
      return await mutateMarketingConsent(payload)
    } catch (error) {
      // 에러 모달은 뮤테이션의 `onError`가 이미 띄웠다. 여기서는 토스트를 건너뛰기 위해
      // `undefined`를 돌려준다 — 레거시도 실패 시 토스트를 띄우지 않는다.
      console.error('[useAlarmSetting] 동의 변경에 실패했습니다.', error)
      return undefined
    }
  }

  /**
   * 동의 토스트. **`<br />`로 두 줄이다** — 레거시가 `v-dompurify-html`로 렌더했다
   * (`mypage.md` P4 P-Q4). 문자열로 넘기면 태그가 그대로 보인다.
   *
   * `result`는 방금 받은 mutation 응답이다. 변경된 플래그와 일시가 거기 담겨 온다.
   */
  const showConsentToast = ({
    title,
    result,
    flagKey,
    dateKey,
  }: {
    title: string
    result: NotificationSetting | undefined
    flagKey: 'marketingDataConsentFlag' | 'receiveAdvertsConsentFlag'
    dateKey:
      'marketingDataConsentLastModifiedDateTime' | 'receiveAdvertsConsentLastModifiedDateTime'
  }) => {
    const flag = pickFlag({ key: flagKey, mutationResult: result, notificationSetting })
    const date = pickFlag({ key: dateKey, mutationResult: result, notificationSetting })?.slice(
      0,
      CONSENT_DATE_LENGTH,
    )

    showToast({
      message: (
        <>
          {title}
          <br />
          {`동의 ${flag ? '일시' : '해제 일시'} ${date}`}
        </>
      ),
    })
  }

  const marketingTerms = MARKETING_TERMS_ITEMS.find((item) => {
    return item.id === TERMS_ID.MARKETING_DATA_CONSENT
  })
  const advertsTerms = MARKETING_TERMS_ITEMS.find((item) => {
    return item.id === TERMS_ID.RECEIVE_ADVERTS_CONSENT
  })

  const alarmGroups: AlarmSettingGroup[] = [
    {
      title: ALARM_GROUP_TITLE.PARKING,
      items: [
        {
          label: ALARM_LABEL.REGULAR_PUSH,
          info: ALARM_INFO.REGULAR_PUSH,
          key: ALARM_FLAG_KEY.REGULAR_PUSH,
          isActive: pickFlag({
            key: ALARM_FLAG_KEY.REGULAR_PUSH,
            mutationResult: regularPushResult,
            notificationSetting,
          }),
          isPending: isRegularPushPending,
          onChange: (value) => {
            mutateRegularPush({ regularPushFlag: value })
          },
        },
        {
          label: ALARM_LABEL.EXTERNAL_PUSH,
          info: ALARM_INFO.EXTERNAL_PUSH,
          key: ALARM_FLAG_KEY.EXTERNAL_PUSH,
          isActive: pickFlag({
            key: ALARM_FLAG_KEY.EXTERNAL_PUSH,
            mutationResult: externalPushResult,
            notificationSetting,
          }),
          isPending: isExternalPushPending,
          onChange: (value) => {
            mutateExternalPush({ externalPushFlag: value })
          },
        },
      ],
      isActive: hasAptParkingContent,
    },
    {
      title: ALARM_GROUP_TITLE.LOBBY_PHONE,
      items: [
        {
          label: ALARM_LABEL.LOBBY_PHONE_PUSH,
          info: ALARM_INFO.EMPTY,
          key: ALARM_FLAG_KEY.LOBBY_PHONE_PUSH,
          // 통합 조회에 없는 값이다. 전용 조회 API를 쓴다
          isActive: lobbyPhonePushAlarmState?.lobbyPhonePushFlag,
          isPending: isLobbyPhonePushAlarmPending,
          // 본문이 없다. 서버가 뒤집으므로 값을 보내지 않는다
          onChange: () => {
            mutateLobbyPhonePushAlarm()
          },
        },
      ],
      isActive: hasLobbyPhone,
    },
    {
      title: ALARM_GROUP_TITLE.WALL_PAD,
      items: [
        {
          label: ALARM_LABEL.WALL_PAD,
          info: ALARM_INFO.EMPTY,
          key: ALARM_FLAG_KEY.WALL_PAD,
          isActive: pickFlag({
            key: ALARM_FLAG_KEY.WALL_PAD,
            mutationResult: wallPadResult,
            notificationSetting,
          }),
          isPending: isWallPadPending,
          onChange: (value) => {
            mutateWallPad({ wallPadParkingNotificationFlag: value })
          },
        },
      ],
      isActive: hasWallPadAlarmUI,
    },
    {
      title: ALARM_GROUP_TITLE.MARKETING,
      items: [
        {
          label: ALARM_LABEL.MARKETING_CONSENT,
          info: ALARM_INFO.EMPTY,
          key: ALARM_FLAG_KEY.MARKETING_CONSENT,
          isActive: marketingFlag,
          isPending: isMarketingConsentPending,
          onChange: async (value) => {
            const result = await changeConsent({ type: 'MARKETING', value })
            if (!result) return
            showConsentToast({
              title: marketingTerms?.title ?? '',
              result,
              flagKey: ALARM_FLAG_KEY.MARKETING_CONSENT,
              dateKey: CONSENT_DATE_KEY.MARKETING,
            })
          },
        },
        {
          label: ALARM_LABEL.RECEIVE_ADVERTS_CONSENT,
          info: ALARM_INFO.EMPTY,
          key: ALARM_FLAG_KEY.RECEIVE_ADVERTS_CONSENT,
          isActive: advertsFlag,
          isPending: isMarketingConsentPending,
          // ⚠️ 레거시에 `isDisabled: !marketingFlag`가 정의돼 있지만 그룹 컴포넌트가
          // `isPending`만 disabled로 넘겨 **무시된다**. 마케팅 미동의 상태에서도
          // 누를 수 있고, 누르면 마케팅까지 켜진다 (`deferred.md` D-46). 그대로 유지.
          onChange: async (value) => {
            const result = await changeConsent({ type: 'ADVERTS', value })
            if (!result) return
            showConsentToast({
              title: advertsTerms?.title ?? '',
              result,
              flagKey: ALARM_FLAG_KEY.RECEIVE_ADVERTS_CONSENT,
              dateKey: CONSENT_DATE_KEY.RECEIVE_ADVERTS,
            })
          },
        },
      ],
      isActive: true,
    },
  ]

  return {
    isResidentDetailInfoLoading,
    isNotificationSettingLoading,
    alarmGroups: alarmGroups.filter((group) => {
      return group.isActive
    }),
  }
}
