import { FROM_NATIVE, TO_NATIVE } from '@/shared/constants/native'
import { sendToNative, subscribeToNative } from '@/shared/lib/native/bridge'
import type { FaceImage } from '@/shared/lib/native/schemas'

/** 레거시 `src/natives/face.js` 이식. */

/** 얼굴 등록용 네이티브 카메라 열기. 결과는 `CALLBACK_FACE_IMAGE`로 온다 */
export const nativeOpenFaceCamera = (): void => {
  sendToNative({ type: TO_NATIVE.OPEN_FACE_CAMERA })
}

/**
 * 촬영 결과 수신. base64 JPEG/PNG.
 * **성공 시에만 온다** — 사용자가 취소하면 앱이 카메라만 닫고 아무것도 보내지 않는다.
 */
export const subscribeToFaceImage = ({
  handler,
}: {
  handler: (faceImage: FaceImage) => void
}): (() => void) => {
  return subscribeToNative<FaceImage>({ type: FROM_NATIVE.CALLBACK_FACE_IMAGE, handler })
}
