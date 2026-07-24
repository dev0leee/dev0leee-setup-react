# 13. 폼 / 입력요소 / 인터랙션

react-hook-form + zod(`zodResolver`) + Base UI. 폼 값은 react-hook-form이 소유한다
([04-state](./04-state.md)).

## 접근 가능한 기본 요소를 쓴다 (MUST)

**`div` + `svg` + `onClick`으로 입력요소를 흉내내지 않는다.** 체크박스·라디오·스위치 같은
컨트롤은 네이티브의 접근성을 유지하는 Base UI 컴포넌트를 쓴다.

흉내낸 컨트롤은 세 가지가 한꺼번에 깨진다 — **키보드로 조작 안 되고, 스크린리더가 못 읽고,
테스트가 `getByRole('checkbox')`로 못 잡는다** ([06-react](./06-react.md) 테스트 절의 role 셀렉터
규칙과 직결된다).

```tsx
// GOOD - Base UI Checkbox + label 연결 + react-hook-form
<Field.Root>
  <Checkbox.Root id="terms" checked={field.value} onCheckedChange={field.onChange} />
  <label htmlFor="terms">유의사항을 확인했습니다.</label>
</Field.Root>

// BAD - div/button + svg로 흉내
<button onClick={() => setChecked(!checked)}>{checked && <CheckIcon />}</button>
```

- **레이블을 연결한다.** `htmlFor`/`id`로 묶어 클릭 영역과 스크린리더 라벨을 확보한다.
- **react-hook-form에 결합한다.** `field.value` / `field.onChange`로 상태를 폼에 맡기고,
  컴포넌트 안에 별도 `useState`로 값을 복제하지 않는다.

## 검증 (MUST)

사용자 입력은 zod 스키마로 검증한다. 타입은 스키마에서 파생시킨다
([05-types](./05-types.md)).

```ts
const schema = z.object({
  email: z.email('올바른 이메일을 입력하세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
})
type FormValues = z.infer<typeof schema>
```

제출 에러는 `useMutation`의 `onError`에서 폼 에러/토스트로 표시한다 — 조회 에러처럼
바운더리로 올리지 않는다 ([03-api](./03-api.md)).

### 검증 대상 (MUST)

zod 스키마로 다음을 전부 막는다. 경계값(빈값, 0, 최대 길이/최댓값, 최소-1, 최대+1)을 실제로 넣어본다.

- **공백·trim** — `z.string().trim().min(1)`. 앞뒤 공백을 제거하고, 공백만 입력한 값은 빈값으로 본다.
- **문자열 길이 / 숫자 범위** — `.min()` / `.max()`. 범위를 명시한다.
- **필수값** — 옵셔널이 아니면 필수임을 스키마가 강제한다.
- **중복** — 서버 확인이 필요하면 제출 후 서버 에러(409 등)를 `onError`에서 필드 에러로 돌린다.

## 사용자 입력 안전성 (MUST)

- **입력을 그대로 HTML로 렌더하지 않는다.** JSX는 기본 escape하지만 `dangerouslySetInnerHTML`,
  `href`, 정규식에 넣을 때는 직접 escape/검증한다.
- **IME 한글 조합을 고려한다.** `onChange`는 **조합 중에도 발화**한다. 조합 중에 즉시 검증·검색·
  치환을 돌리면 깨진 글자(`ㅎ`, `한ㄱ`)가 들어간다. 실시간 처리는 `onCompositionEnd`를 기다리거나
  debounce한다. 폼 제출값은 조합이 끝난 값이라 안전하다.

## 제출 처리 (MUST)

- **펜딩·성공·에러를 다 처리한다.** 세 상태 모두 UI가 있어야 한다 — 펜딩 중 버튼 잠금, 성공
  피드백(토스트·이동), 에러 표시.
- **중복 제출을 막는다.** 제출 버튼을 뮤테이션의 `isPending`으로 disable한다. `mutate`는 비동기를
  반환하지 않아 폼의 `isSubmitting`이 안 붙으니, `isPending`을 쓴다.
- **제출 성공 후 이동은 `replace`.** 뒤로가기로 등록/수정/삭제 폼에 다시 돌아오지 않게 한다
  ([08-routing](./08-routing.md)).
- **수정·삭제 가능 여부는 서버 상태도 반영한다.** 클라 플래그로만 버튼을 disable하지 말고,
  서버가 주는 상태(이미 취소됨·마감됨 등)를 query 데이터로 받아 함께 건다. 낙관적으로 열어두면
  서버에서 거절당하는 요청이 나간다.
