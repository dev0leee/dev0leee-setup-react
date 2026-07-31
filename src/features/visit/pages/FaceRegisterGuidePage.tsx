import { useSearchParams } from 'react-router-dom'

import { FACE_GUIDE_ITEMS } from '@/features/visit/constants/faceRecog'
import { useFaceCapture } from '@/features/visit/hooks/useFaceCapture'

/**
 * 얼굴 신규 등록 — 촬영 가이드 (V11). 위저드 2/2단계.
 * 레거시 `FaceRegisterGuideView.vue`(112 LOC) 이식.
 *
 * `다음`을 누르면 **네이티브 카메라가 열리고**, 촬영 결과가 `CALLBACK_FACE_IMAGE`로
 * 돌아오면 그 자리에서 등록 요청을 보낸다. 성공하면 V13, 실패하면 V12로 간다.
 *
 * ⚠️ **이름·비고를 쿼리스트링에서 읽는다** (V10이 그렇게 넘긴다).
 * ⚠️ **취소하면 아무 일도 일어나지 않는다.** 앱이 신호를 주지 않으므로 화면은 그대로고
 * 버튼도 다시 누를 수 있다 — 의도된 동작이다.
 */
export const FaceRegisterGuidePage = () => {
  const [searchParams] = useSearchParams()

  const { openFaceCamera, isFaceRecogPostPending } = useFaceCapture({
    faceRecogName: searchParams.get('name') ?? '',
    faceRecogDescription: searchParams.get('memo') ?? '',
  })

  return (
    <div className="flex h-full w-full flex-col bg-defaults-primary-background-primary">
      <div className="flex flex-1 flex-col gap-8 overflow-auto px-5 py-6">
        <div className="flex flex-col gap-2">
          <span className="pretendard-16SemiBold text-brand-default-text-brand">
            얼굴 촬영 안내
          </span>
          <h2 className="pretendard-24Bold text-defaults-primary-text-primary">
            정확한 얼굴 촬영을 위해
            <br />
            가이드를 참고해주세요.
          </h2>
        </div>

        {FACE_GUIDE_ITEMS.map((item, index) => {
          return (
            <div key={item.title} className="flex flex-col gap-[7px]">
              <p className="pretendard-18SemiBold text-defaults-primary-text-primary">
                {index + 1}. {item.title}
              </p>
              <div className="flex gap-2">
                <img
                  className="min-w-0 flex-1"
                  src={item.good}
                  alt={`가이드 ${index + 1} 올바른 예시`}
                />
                <img
                  className="min-w-0 flex-1"
                  src={item.bad}
                  alt={`가이드 ${index + 1} 잘못된 예시`}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-4 pt-2 pb-3">
        <button
          type="button"
          disabled={isFaceRecogPostPending}
          className="flex h-14 w-full items-center justify-center rounded-lg bg-brand-default-background-brand shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] disabled:opacity-50"
          onClick={openFaceCamera}
        >
          <span className="pretendard-18SemiBold text-base-b-white">다음</span>
        </button>
      </div>
    </div>
  )
}
