import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { useNativeBackButton } from '@/app/hooks/useNativeBackButton'
import { useNavigationGuard } from '@/app/hooks/useNavigationGuard'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { APP_EXIT_MODAL_DATA } from '@/shared/constants/layout'
import { nativeExitApp } from '@/shared/lib/native/common'
import { useFontSizeStore } from '@/shared/stores/fontSizeStore'

/**
 * 앱 셸. 레거시 `components/layouts/LayoutBase.vue` 이식.
 *
 * 하는 일 세 가지:
 *  1. `data-font-size`로 접근성 글자 배율을 전체에 적용한다 (`index.css`의 CSS 변수)
 *  2. 네이티브 하드웨어 뒤로가기를 구독한다
 *  3. 더 뒤로 갈 곳이 없을 때(Android) 앱 종료 확인 모달을 띄운다
 *  4. 오프라인·종착지 화면에서의 이동을 막는다 (레거시 라우터 가드의 `return false`)
 *
 * `h-screen overflow-hidden`이 레거시 그대로다 — 스크롤은 각 화면의 `main`이 갖는다.
 */
export const RootLayout = () => {
  const fontSize = useFontSizeStore((state) => {
    return state.fontSize
  })
  const [isExitModalOpen, setIsExitModalOpen] = useState(false)

  useNavigationGuard()

  useNativeBackButton({
    onRequestExit: () => {
      setIsExitModalOpen(true)
    },
  })

  const closeExitModal = () => {
    setIsExitModalOpen(false)
  }

  return (
    <div data-font-size={fontSize} className="h-screen overflow-hidden">
      <Outlet />

      <ModalButton
        open={isExitModalOpen}
        onClose={closeExitModal}
        buttonType="dual"
        modalData={APP_EXIT_MODAL_DATA}
        onFirstClick={closeExitModal}
        onSecondClick={nativeExitApp}
      />
    </div>
  )
}
