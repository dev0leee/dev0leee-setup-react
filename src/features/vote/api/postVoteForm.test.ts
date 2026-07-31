import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { postVoteForm } from '@/features/vote/api/vote'
import { url } from '@/testing/mocks/handlers'
import { server } from '@/testing/mocks/server'

/**
 * 제출 페이로드의 **필드 이름이 계약**이다. 화면은 `optionList`로 다루지만 요청은
 * `optionUuidList`로 나가고, 인덱스가 키에 박힌다. 화면 테스트로는 여기까지 닿을 수
 * 없어서(서명 캔버스가 터치 전용이라 jsdom에서 그릴 수 없다) API 함수를 직접 부른다.
 */
describe('postVoteForm', () => {
  it('질문·선택지 인덱스가 박힌 평평한 키로 보낸다', async () => {
    let body = ''
    server.use(
      http.post(url({ path: '/board/non-resident/voter/voter-1' }), async ({ request }) => {
        body = await request.text()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await postVoteForm({
      voterUuid: 'voter-1',
      questionList: [
        { questionUuid: 'q1', questionType: 'SINGLE_CHOICE', optionList: ['o1'] },
        { questionUuid: 'q2', questionType: 'MULTIPLE_CHOICE', optionList: ['m1', 'm2'] },
      ],
      signFile: new File(['sign'], 'signature.png', { type: 'image/png' }),
    })

    expect(body).toContain('name="questionList[0].questionUuid"')
    expect(body).toContain('name="questionList[0].questionType"')
    // ⚠️ 화면 필드명은 `optionList`인데 요청은 `optionUuidList`다
    expect(body).toContain('name="questionList[0].optionUuidList[0]"')
    expect(body).toContain('name="questionList[1].optionUuidList[1]"')
    expect(body).toContain('name="signFile"')
    expect(body).toContain('m2')
  })
})
