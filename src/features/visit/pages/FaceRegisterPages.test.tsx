import { http, HttpResponse } from 'msw'
import { Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { FaceRegisterCompletePage } from '@/features/visit/pages/FaceRegisterCompletePage'
import { FaceRegisterDetailPage } from '@/features/visit/pages/FaceRegisterDetailPage'
import { FaceRegisterEditPage } from '@/features/visit/pages/FaceRegisterEditPage'
import { FaceRegisterFailPage } from '@/features/visit/pages/FaceRegisterFailPage'
import { FaceRegisterFormPage } from '@/features/visit/pages/FaceRegisterFormPage'
import { FaceRegisterGuidePage } from '@/features/visit/pages/FaceRegisterGuidePage'
import { FaceRegisterManagementPage } from '@/features/visit/pages/FaceRegisterManagementPage'
import { API_PREFIX } from '@/shared/constants/api'
import { FROM_NATIVE } from '@/shared/constants/native'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { emitInternal } from '@/shared/lib/native/bridge'
import { useAuthStore } from '@/shared/stores/authStore'
import { useErrorModalStore } from '@/shared/stores/errorModalStore'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'
import { renderWithProviders, screen, userEvent, waitFor } from '@/testing/utils'

const RESIDENT_UUID = 'resident-uuid-1'
const FACE_PATH = `${API_PREFIX.APARTMANT}/${RESIDENT_UUID}/lobby-phone/face-recog`
const GUID = 'face-guid-1'

/** 1x1 투명 PNG의 base64. `iVBO`로 시작해 `base64ToFile`이 image/png로 판별한다 */
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const FACE = {
  faceRecogGuid: GUID,
  residentFaceName: '홍길동',
  faceRecogDescription: '아버지',
  faceRecogStatus: 'COMPLETE',
  insertDate: '2026-07-29T10:00:00',
}

const useList = (list: unknown[]) => {
  server.use(
    http.get(url({ path: FACE_PATH }), () => {
      return HttpResponse.json({ success: list })
    }),
  )
}

/**
 * 등록 요청을 가로채 **원문 multipart 본문**을 모아 둔다.
 *
 * ⚠️ `request.formData()`를 쓰지 않는다 — jsdom이 만든 `File`을 undici 파서가
 * 거부해(`multipartFormDataParser` assertion) 핸들러 자체가 터진다. 파싱 대신
 * 원문에서 파트 이름을 확인한다.
 */
const useCapturedPost = () => {
  let body = ''

  server.use(
    http.post(url({ path: FACE_PATH }), async ({ request }) => {
      body = await request.text()
      return new HttpResponse(null, { status: 204 })
    }),
  )

  return {
    readBody: () => {
      return body
    },
  }
}

const useDetail = (face: unknown) => {
  server.use(
    http.get(url({ path: `${FACE_PATH}/:guid` }), () => {
      return HttpResponse.json({ success: face })
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ aptInfo: { aptResidentUuid: RESIDENT_UUID } })
  useErrorModalStore.setState({ current: null })
})

describe('FaceRegisterManagementPage (V7)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.VISIT_FACE_REGISTER_MANAGEMENT],
      ui: (
        <Routes>
          <Route
            path={ROUTE_PATH.VISIT_FACE_REGISTER_MANAGEMENT}
            element={<FaceRegisterManagementPage />}
          />
          <Route path={ROUTE_PATH.VISIT_FACE_REGISTER_FORM} element={<h1>정보 입력 화면</h1>} />
          <Route path={ROUTE_PATH.VISIT_FACE_REGISTER_DETAIL} element={<h1>상세 화면</h1>} />
          <Route path={ROUTE_PATH.MAIN} element={<h1>메인</h1>} />
        </Routes>
      ),
    })
  }

  it('카운트와 상태 칩·등록일을 보여준다', async () => {
    useList([FACE])

    renderPage()

    expect(await screen.findByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('/10')).toBeInTheDocument()
    expect(screen.getByText('등록완료')).toBeInTheDocument()
    expect(screen.getByText('등록일 2026.07.29')).toBeInTheDocument()
  })

  it('상태 3종의 라벨이 각각 다르다', async () => {
    useList([
      { ...FACE, faceRecogGuid: 'g1', faceRecogStatus: 'COMPLETE' },
      { ...FACE, faceRecogGuid: 'g2', faceRecogStatus: 'PENDING' },
      { ...FACE, faceRecogGuid: 'g3', faceRecogStatus: 'REJECT' },
    ])

    renderPage()

    expect(await screen.findByText('등록완료')).toBeInTheDocument()
    expect(screen.getByText('등록대기')).toBeInTheDocument()
    expect(screen.getByText('등록실패')).toBeInTheDocument()
  })

  it('⚠️ 비고가 없으면 `|` 구분자도 사라진다', async () => {
    useList([{ ...FACE, faceRecogDescription: null }])

    renderPage()

    await screen.findByText('홍길동')
    expect(screen.queryByText('|')).not.toBeInTheDocument()
  })

  it('⚠️ 10개면 `신규 등록`이 사라지고 경고 배너가 뜬다', async () => {
    useList(
      Array.from({ length: 10 }, (_, index) => {
        return { ...FACE, faceRecogGuid: `g${index}` }
      }),
    )

    renderPage()

    expect(
      await screen.findByText(
        '등록 가능한 얼굴 수를 모두 사용했습니다. 새로운 얼굴을 등록하려면 기존 얼굴을 삭제해주세요.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('신규 등록')).not.toBeInTheDocument()
  })

  it('동의해야 `등록 진행하기`가 눌린다', async () => {
    useList([FACE])

    renderPage()
    await userEvent.click(await screen.findByText('신규 등록'))

    const confirmButton = screen.getByRole('button', { name: '등록 진행하기' })
    expect(confirmButton).toBeDisabled()

    await userEvent.click(screen.getByAltText('동의안함'))
    expect(confirmButton).toBeEnabled()

    await userEvent.click(confirmButton)
    expect(await screen.findByRole('heading', { name: '정보 입력 화면' })).toBeInTheDocument()
  })

  it('시트를 닫았다 다시 열면 동의가 풀린다', async () => {
    useList([FACE])

    renderPage()
    await userEvent.click(await screen.findByText('신규 등록'))
    await userEvent.click(screen.getByAltText('동의안함'))
    expect(screen.getByAltText('동의함')).toBeInTheDocument()

    // 딤을 눌러 닫는다
    await userEvent.click(
      screen.getByText('사진 정보 저장 알림').closest('div.fixed') as HTMLElement,
    )
    await userEvent.click(screen.getByText('신규 등록'))

    expect(screen.getByAltText('동의안함')).toBeInTheDocument()
  })

  it('0건이면 빈 문구가 뜬다', async () => {
    useList([])

    renderPage()

    expect(await screen.findByText('등록된 얼굴이 없습니다.')).toBeInTheDocument()
  })

  it('⚠️ 조회에 실패하면 모달을 띄우고 **메인**으로 보낸다', async () => {
    server.use(
      http.get(url({ path: FACE_PATH }), () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderPage()

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe(
        '얼굴인식 목록 조회에 실패하였습니다.',
      )
    })
  })

  it('에러코드가 매핑에 있으면 그 문구가 뜬다', async () => {
    server.use(
      http.get(url({ path: FACE_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'LOBBY_PHONE_SERVER_ERROR', message: '무시된다' } },
          { status: 500 },
        )
      }),
    )

    renderPage()

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe('로비폰 서버 점검중입니다.')
    })
  })
})

describe('FaceRegisterDetailPage (V8)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [`/visit/lobbyPhone/faceRegister/detail/${GUID}`],
      ui: (
        <Routes>
          <Route
            path={ROUTE_PATH.VISIT_FACE_REGISTER_DETAIL}
            element={<FaceRegisterDetailPage />}
          />
          <Route path={ROUTE_PATH.VISIT_FACE_REGISTER_EDIT} element={<h1>수정 화면</h1>} />
          <Route
            path={ROUTE_PATH.VISIT_FACE_REGISTER_MANAGEMENT}
            element={<h1>얼굴 등록 관리</h1>}
          />
        </Routes>
      ),
    })
  }

  it('`COMPLETE`는 안내 박스 없이 칩만 보여준다', async () => {
    useDetail(FACE)

    renderPage()

    expect(await screen.findByText('등록완료')).toBeInTheDocument()
    expect(screen.queryByText(/로비폰 서버로 등록 요청 중입니다/)).not.toBeInTheDocument()
    expect(
      screen.getByText('등록된 사진은 개인정보 보호를 위해 표시되지 않습니다.'),
    ).toBeInTheDocument()
  })

  it('`PENDING`은 대기 안내를 보여준다', async () => {
    useDetail({ ...FACE, faceRecogStatus: 'PENDING' })

    renderPage()

    expect(
      await screen.findByText(
        '로비폰 서버로 등록 요청 중입니다. 최대 10분 소요됩니다. 잠시만 기다려 주세요.',
      ),
    ).toBeInTheDocument()
  })

  it('`REJECT`는 `registCause` 문구를 보여준다', async () => {
    useDetail({ ...FACE, faceRecogStatus: 'REJECT', registCause: 'DuplicatedFace' })

    renderPage()

    expect(
      await screen.findByText(
        '이미 중복 등록된 얼굴입니다. 등록한 이전 정보를 삭제 후 재등록 해주세요.',
      ),
    ).toBeInTheDocument()
  })

  it('⚠️ 알 수 없는 `registCause`는 `ExceptionOccurred` 문구로 떨어진다', async () => {
    useDetail({ ...FACE, faceRecogStatus: 'REJECT', registCause: '누구세요' })

    renderPage()

    expect(await screen.findByText(/등록 중 오류가 발생했습니다/)).toBeInTheDocument()
  })

  it('⚠️ `REJECT`면 대기 안내는 뜨지 않는다 (배타적)', async () => {
    useDetail({ ...FACE, faceRecogStatus: 'REJECT', registCause: 'DuplicatedFace' })

    renderPage()

    await screen.findByText(/이미 중복 등록된 얼굴입니다/)
    expect(screen.queryByText(/로비폰 서버로 등록 요청 중입니다/)).not.toBeInTheDocument()
  })

  it('삭제 모달에 이름이 들어가고, 삭제하면 **body에 guid를 실어** 보낸 뒤 목록으로 간다', async () => {
    useDetail(FACE)

    let body: Record<string, unknown> = {}
    server.use(
      http.delete(url({ path: FACE_PATH }), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await userEvent.click(await screen.findByText('삭제'))

    expect(screen.getByText(/홍길동님의 얼굴 등록정보를 삭제하시겠어요\?/)).toBeInTheDocument()

    await userEvent.click(screen.getAllByText('삭제').at(-1) as HTMLElement)

    expect(await screen.findByRole('heading', { name: '얼굴 등록 관리' })).toBeInTheDocument()
    expect(body).toEqual({ faceRecogGuid: GUID })
  })

  it('`취소`를 누르면 삭제하지 않는다', async () => {
    useDetail(FACE)

    renderPage()
    await userEvent.click(await screen.findByText('삭제'))
    await userEvent.click(screen.getByText('취소'))

    expect(screen.queryByText('얼굴 등록 정보 삭제')).not.toBeInTheDocument()
  })

  it('`수정`을 누르면 수정 화면으로 간다', async () => {
    useDetail(FACE)

    renderPage()
    await userEvent.click(await screen.findByText('수정'))

    expect(await screen.findByRole('heading', { name: '수정 화면' })).toBeInTheDocument()
  })

  it('⚠️ 조회에 실패하면 모달을 띄우고 **목록**으로 보낸다', async () => {
    server.use(
      http.get(url({ path: `${FACE_PATH}/:guid` }), () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderPage()

    await waitFor(() => {
      expect(useErrorModalStore.getState().current?.text).toBe(
        '얼굴인식 정보 조회에 실패하였습니다.',
      )
    })
  })
})

describe('FaceRegisterEditPage (V9)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [`/visit/lobbyPhone/faceRegister/edit/${GUID}`],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.VISIT_FACE_REGISTER_EDIT} element={<FaceRegisterEditPage />} />
          <Route path={ROUTE_PATH.VISIT_FACE_REGISTER_DETAIL} element={<h1>상세 화면</h1>} />
        </Routes>
      ),
    })
  }

  it('기존 이름·비고가 채워진다', async () => {
    useDetail(FACE)

    renderPage()

    expect(await screen.findByDisplayValue('홍길동')).toBeInTheDocument()
    expect(screen.getByDisplayValue('아버지')).toBeInTheDocument()
  })

  it('🔴 이름을 **비워도 저장된다** (V10과 달리 검증이 없다)', async () => {
    useDetail(FACE)

    let body: Record<string, unknown> = {}
    server.use(
      http.put(url({ path: FACE_PATH }), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderPage()
    await userEvent.clear(await screen.findByDisplayValue('홍길동'))
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByRole('heading', { name: '상세 화면' })).toBeInTheDocument()
    expect(body).toEqual({
      faceRecogGuid: GUID,
      faceRecogName: '',
      faceRecogDescription: '아버지',
    })
  })

  it('⚠️ 로딩 중에는 **저장 버튼조차 없다**', () => {
    useDetail(FACE)

    renderPage()

    expect(screen.queryByRole('button', { name: '저장' })).not.toBeInTheDocument()
  })
})

describe('FaceRegisterFormPage (V10)', () => {
  /**
   * 다음 화면이 받은 쿼리스트링을 그대로 찍는 대역.
   * ⚠️ `window.location.search`는 `MemoryRouter`에서 jsdom 주소를 가리킨다 —
   * 반드시 라우터의 위치를 읽어야 한다.
   */
  const GuideStub = () => {
    const { search } = useLocation()
    return <h1>가이드 {search}</h1>
  }

  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [ROUTE_PATH.VISIT_FACE_REGISTER_FORM],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.VISIT_FACE_REGISTER_FORM} element={<FaceRegisterFormPage />} />
          <Route path={ROUTE_PATH.VISIT_FACE_REGISTER_GUIDE} element={<GuideStub />} />
        </Routes>
      ),
    })
  }

  it('이름이 비면 `다음`이 눌리지 않는다', async () => {
    renderPage()

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()

    await userEvent.type(screen.getByLabelText('이름 및 별칭'), '   ')
    // 공백만으로는 통과하지 않는다
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  it('🔴 이름·비고가 **쿼리스트링으로** 넘어간다', async () => {
    renderPage()

    await userEvent.type(screen.getByLabelText('이름 및 별칭'), '홍길동')
    await userEvent.type(screen.getByLabelText('비고'), '아버지')
    await userEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(await screen.findByRole('heading', { name: /가이드/ })).toHaveTextContent(
      'name=%ED%99%8D%EA%B8%B8%EB%8F%99',
    )
  })
})

describe('FaceRegisterGuidePage (V11)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [`${ROUTE_PATH.VISIT_FACE_REGISTER_GUIDE}?name=%ED%99%8D&memo=%EC%95%84`],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.VISIT_FACE_REGISTER_GUIDE} element={<FaceRegisterGuidePage />} />
          <Route
            path={ROUTE_PATH.VISIT_FACE_REGISTER_COMPLETE}
            element={<FaceRegisterCompletePage />}
          />
          <Route path={ROUTE_PATH.VISIT_FACE_REGISTER_FAIL} element={<FaceRegisterFailPage />} />
          <Route
            path={ROUTE_PATH.VISIT_FACE_REGISTER_MANAGEMENT}
            element={<h1>얼굴 등록 관리</h1>}
          />
        </Routes>
      ),
    })
  }

  it('가이드 4개의 예시 이미지 8장이 모두 있다', () => {
    renderPage()

    expect(screen.getByText('1. 정면을 바라봐주세요.')).toBeInTheDocument()
    expect(screen.getAllByAltText(/올바른 예시/)).toHaveLength(4)
    expect(screen.getAllByAltText(/잘못된 예시/)).toHaveLength(4)
  })

  it('촬영 결과가 오면 **쿼리스트링의 이름**으로 등록하고 완료 화면(V13)으로 간다', async () => {
    const { readBody } = useCapturedPost()

    renderPage()
    emitInternal({ type: FROM_NATIVE.CALLBACK_FACE_IMAGE, payload: { image: PNG_BASE64 } })

    expect(await screen.findByText('안면인식 얼굴 등록 요청이 완료되었습니다.')).toBeInTheDocument()

    const body = readBody()
    expect(body).toContain('name="faceRecogName"')
    expect(body).toContain('홍')
    expect(body).toContain('name="faceRecogDescription"')
    expect(body).toContain('아')
    // ⚠️ 파일명은 확인하지 않는다 — jsdom XHR을 거치면 `blob`으로 바뀐다(실기기는 유지).
    // 대신 **magic bytes로 판별한 MIME이 붙는지**를 본다
    expect(body).toContain('name="faceRecogFile"')
    expect(body).toContain('Content-Type: image/png')
  })

  it('등록에 실패하면 **모달이 아니라 실패 화면(V12)**으로 가고 사유가 보인다', async () => {
    server.use(
      http.post(url({ path: FACE_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: 'FACE_RECOG_LIMIT_OVER', message: '무시된다' } },
          { status: 400 },
        )
      }),
    )

    renderPage()
    emitInternal({ type: FROM_NATIVE.CALLBACK_FACE_IMAGE, payload: { image: PNG_BASE64 } })

    expect(await screen.findByText('얼굴 등록 요청에 실패하였습니다.')).toBeInTheDocument()
    expect(screen.getByText('등록 가능한 최대 개수(10개)를 초과했습니다.')).toBeInTheDocument()
  })

  it('🔴 매핑에 없는 에러코드는 **서버 원문**이 사유가 된다', async () => {
    server.use(
      http.post(url({ path: FACE_PATH }), () => {
        return HttpResponse.json(
          { error: { errorCode: '누구세요', message: '서버가 준 문구' } },
          { status: 400 },
        )
      }),
    )

    renderPage()
    emitInternal({ type: FROM_NATIVE.CALLBACK_FACE_IMAGE, payload: { image: PNG_BASE64 } })

    expect(await screen.findByText('서버가 준 문구')).toBeInTheDocument()
  })

  it('⚠️ 화면을 떠나면 촬영 리스너를 해제한다', async () => {
    let postCount = 0
    server.use(
      http.post(url({ path: FACE_PATH }), () => {
        postCount += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { unmount } = renderPage()
    unmount()

    emitInternal({ type: FROM_NATIVE.CALLBACK_FACE_IMAGE, payload: { image: PNG_BASE64 } })

    await waitFor(() => {
      expect(postCount).toBe(0)
    })
  })
})

describe('FaceRegisterFailPage (V12)', () => {
  const renderPage = () => {
    return renderWithProviders({
      initialEntries: [
        {
          pathname: ROUTE_PATH.VISIT_FACE_REGISTER_FAIL,
          state: { name: '홍길동', memo: '아버지', reason: '로비폰 서버 점검중입니다.' },
        },
      ],
      ui: (
        <Routes>
          <Route path={ROUTE_PATH.VISIT_FACE_REGISTER_FAIL} element={<FaceRegisterFailPage />} />
          <Route
            path={ROUTE_PATH.VISIT_FACE_REGISTER_COMPLETE}
            element={<FaceRegisterCompletePage />}
          />
          <Route path={ROUTE_PATH.MAIN} element={<h1>메인</h1>} />
        </Routes>
      ),
    })
  }

  it('사유를 보여준다', () => {
    renderPage()

    expect(screen.getByText('로비폰 서버 점검중입니다.')).toBeInTheDocument()
  })

  it('⚠️ `홈으로 이동`은 목록이 아니라 **메인**으로 간다', async () => {
    renderPage()
    await userEvent.click(screen.getByText('홈으로 이동'))

    expect(await screen.findByRole('heading', { name: '메인' })).toBeInTheDocument()
  })

  it('재시도로 다시 촬영하면 **직전 이름·비고**가 유지된다', async () => {
    const { readBody } = useCapturedPost()

    renderPage()
    emitInternal({ type: FROM_NATIVE.CALLBACK_FACE_IMAGE, payload: { image: PNG_BASE64 } })

    await screen.findByText('안면인식 얼굴 등록 요청이 완료되었습니다.')

    expect(readBody()).toContain('홍길동')
    expect(readBody()).toContain('아버지')
  })
})

describe('FaceRegisterCompletePage (V13)', () => {
  it('`얼굴 등록 내역 확인`은 목록(V7)으로 간다', async () => {
    renderWithProviders({
      initialEntries: [ROUTE_PATH.VISIT_FACE_REGISTER_COMPLETE],
      ui: (
        <Routes>
          <Route
            path={ROUTE_PATH.VISIT_FACE_REGISTER_COMPLETE}
            element={<FaceRegisterCompletePage />}
          />
          <Route
            path={ROUTE_PATH.VISIT_FACE_REGISTER_MANAGEMENT}
            element={<h1>얼굴 등록 관리</h1>}
          />
        </Routes>
      ),
    })

    await userEvent.click(screen.getByText('얼굴 등록 내역 확인'))

    expect(await screen.findByRole('heading', { name: '얼굴 등록 관리' })).toBeInTheDocument()
  })
})
