import { useEffect } from 'react'

import { usePostFaceRecog } from '@/features/visit/queries/useFaceRecog'
import { nativeOpenFaceCamera, subscribeToFaceImage } from '@/shared/lib/native/face'
import { base64ToFile } from '@/shared/utils/base64ToFile'

/**
 * 네이티브 카메라 왕복 (V11·V12 공용).
 *
 * `openFaceCamera()` → 앱이 카메라를 열고 촬영 → `CALLBACK_FACE_IMAGE`로 base64가 온다 →
 * `File`로 바꿔 등록 요청. 레거시 V11·V12가 같은 코드를 복사해 갖고 있던 것을 하나로 합쳤다.
 *
 * ⚠️ **취소하면 아무 신호도 오지 않는다.** 그래서 로딩 오버레이를 띄우면 영영 걸린다 —
 * 레거시처럼 버튼 `disabled`만 쓴다. 취소 후 다시 누를 수 있는 것도 의도된 동작이다.
 *
 * ⚠️ **이름·비고는 화면이 준 값을 그대로 보낸다.** V11은 쿼리스트링에서, V12는
 * `location.state`에서 복원한다 — 위저드 상태 전달 방식이 화면마다 다르다(레거시 그대로).
 *
 * ⚠️ 레거시는 `image`가 없으면 `TypeError`로 죽었다. **빈 payload는 무시한다** —
 * 정상 촬영에서는 결과가 같다.
 */
export const useFaceCapture = ({
  faceRecogName,
  faceRecogDescription,
}: {
  faceRecogName: string
  faceRecogDescription: string
}) => {
  const { postFaceRecogMutation, isFaceRecogPostPending } = usePostFaceRecog()

  useEffect(() => {
    return subscribeToFaceImage({
      handler: ({ image }) => {
        if (!image) return

        postFaceRecogMutation({
          faceRecogName,
          faceRecogDescription,
          faceRecogFile: base64ToFile({
            base64String: image,
            fileName: `face_${Date.now()}`,
          }),
        })
      },
    })
  }, [faceRecogName, faceRecogDescription, postFaceRecogMutation])

  return { openFaceCamera: nativeOpenFaceCamera, isFaceRecogPostPending }
}
