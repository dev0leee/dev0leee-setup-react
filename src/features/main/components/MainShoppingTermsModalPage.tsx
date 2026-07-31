import { getMainEnv } from '@/config/env'
import { IframeBase } from '@/shared/components/common/IframeBase'
import { ModalPage } from '@/shared/components/common/ModalPage'
import { TERMS_ITEMS } from '@/shared/constants/terms'

/**
 * 약관 본문 모달. 레거시 `MainShoppingTermsModalPage.vue` 이식.
 * 회원가입 약관 상세(`features/terms`)와 같은 구조지만, 라우트가 아니라
 * 바텀시트 위에 겹쳐 뜨는 모달이다.
 *
 * ⚠️ **모달 헤더 제목이 비어 있다.** 바텀시트가 `:title`을 넘기지만 레거시 컴포넌트의
 * `defineProps`에 `title`이 없어 받지 못하고, `ModalPage`에도 넘기지 않는다.
 * 결과적으로 `ModalPage`의 기본값(빈 문자열)이 표시된다. 그대로 옮겼다 —
 * 제목을 채우면 화면이 달라진다 (`deferred.md` D-222).
 */
export const MainShoppingTermsModalPage = ({
  termsId,
  onClose,
}: {
  termsId: string
  onClose: () => void
}) => {
  const termsItem = TERMS_ITEMS.find((item) => {
    return item.id === termsId
  })

  return (
    <ModalPage open onClose={onClose}>
      {termsItem && (
        <IframeBase
          title={termsItem.title}
          src={`${getMainEnv().VITE_TERMS_URL}/${termsItem.id}`}
        />
      )}
    </ModalPage>
  )
}
