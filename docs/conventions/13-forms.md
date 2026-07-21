# 13. 입력요소 · 폼 · 인터랙션

## 지금 커뮤니티는 (2026-07 기준)

**React Hook Form이 여전히 기본값이다.** GitHub 스타는 RHF 45K(열린 이슈 11개) vs TanStack Form 6.6K(열린 이슈 156개)로 성숙도 차이가 크다. 2026년 비교 글들의 결론도 일치한다: _"React Hook Form remains the default choice for most React applications in 2026 — battle-tested, performant, great ecosystem, and works well with React 19."_

**TanStack Form이 이기는 구간은 좁고 분명하다:** 깊게 중첩된 동적 폼, 검증 타이밍의 세밀한 제어, 이미 TanStack 스택(Query/Router)을 쓰는 팀.

**주목할 함정 하나.** TanStack Form은 타입을 `defaultValues`에서 추론하는데, **여기에 zod 스키마까지 붙이면 진실의 출처가 둘이 되어 어긋날 수 있다.** RHF + `zodResolver`는 스키마가 유일한 출처라 이 문제가 없다.

**아키텍처 차이:** RHF는 비제어(uncontrolled) — 값을 React state 밖에 두고 ref로 DOM을 갱신해서 타이핑이 리렌더를 안 만든다. TanStack Form은 반응형 스토어 — 필드별 구독자만 갱신된다.

### 이 프로젝트의 결정

**RHF + zod를 쓴다.** 이유는 (1) 폼이 단순~중간 복잡도이고, (2) 스키마 단일 출처가 유지되고, (3) 이미 설치돼 있고 `LoginPage.tsx`가 기준 구현이기 때문이다.
**재검토 조건:** 배열 필드가 중첩되는 동적 폼이 나오고 RHF의 `useFieldArray`로 타입이 무너지기 시작하면 그때 TanStack Form을 논의한다.

---

## 폼 구성 (MUST)

### 1. zod 스키마를 컴포넌트 파일 상단에 둔다

```tsx
const schema = z.object({
  email: z.email('올바른 이메일을 입력하세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
})

type FormValues = z.infer<typeof schema>
```

- 타입은 **반드시 `z.infer`로 파생**시킨다. 손으로 두 번 쓰지 않는다 ([05-types](./05-types.md)).
- 에러 메시지는 스키마 안에 쓴다 ([12-constants](./12-constants.md)).
- 여러 폼이 공유하는 스키마만 `features/<f>/schemas.ts`로 뺀다.

### 2. `useForm`에 resolver를 연결한다

```tsx
const {
  register,
  handleSubmit,
  setError,
  formState: { errors, isSubmitting },
} = useForm<FormValues>({ resolver: zodResolver(schema) })
```

수정 폼이면 `defaultValues`를 넘긴다. 서버 데이터가 늦게 오면 `useForm`의 `values`를 쓰거나
`key`로 재마운트시킨다 — `reset`을 `useEffect`로 부르지 않는다 ([06-react](./06-react.md)).

### 3. 제출은 mutation에 위임한다

```tsx
const mutation = useMutation({
  mutationFn: login,
  onSuccess: ({ accessToken, user }) => {
    setAccessToken(accessToken)
    setAuthenticated(user)
    void navigate(from, { replace: true })
  },
  onError: (error: Error) => {
    setError('root', { message: error.message })
  },
})
```

- **MUST — 서버 에러는 `setError('root', ...)`로 폼에 붙인다.** 토스트로 흘려보내지 않는다.
  필드별 에러면 `setError('email', ...)`.
- **MUST — `mutations.throwOnError`가 `false`**라 에러가 바운더리로 안 간다. `onError`를 반드시 쓴다.

### 4. `handleSubmit` 연결

`onSubmit`은 Promise를 반환하면 안 되므로 `void`로 감싼다.

```tsx
<form
  className="flex flex-col gap-4"
  onSubmit={(e) => {
    void handleSubmit((values) => mutation.mutateAsync(values))(e)
  }}
>
```

## 입력요소 (MUST)

### 라벨을 반드시 연결한다

```tsx
<Label htmlFor="email">이메일</Label>
<Input id="email" type="email" autoComplete="email" {...register('email')} />
```

`id`와 `htmlFor`가 짝이어야 한다. 스크린리더와 `getByLabelText` 테스트가 여기 의존한다.
시각적 라벨이 없으면 `aria-label`을 쓴다.

### `type`과 `autoComplete`를 정확히 준다

브라우저 자동완성과 모바일 키보드가 여기서 결정된다.

| 용도            | type                           | autoComplete       |
| --------------- | ------------------------------ | ------------------ |
| 이메일          | `email`                        | `email`            |
| 로그인 비밀번호 | `password`                     | `current-password` |
| 신규 비밀번호   | `password`                     | `new-password`     |
| 이름            | `text`                         | `name`             |
| 전화            | `tel`                          | `tel`              |
| 검색            | `search`                       | `off`              |
| 금액/수량       | `text` + `inputMode="numeric"` | `off`              |

> **SHOULD — 숫자 입력에 `type="number"`를 피한다.** 스크롤로 값이 바뀌고 포맷팅이 어렵다.

### `register` vs `Controller`

**기본은 `register`.** 비제어라 타이핑이 리렌더를 안 만든다 — RHF를 쓰는 이유 자체다.
`register`로 안 되는 컴포넌트(Select, DatePicker, Checkbox 그룹)만 `Controller`로 감싼다.

> **`watch`를 쓸 때 주의.** RHF의 `watch`는 interior mutability라 React Compiler가 분석하지 못하는
> 대표 사례로 지목된다 ([06-react](./06-react.md)). 값 하나만 필요하면 `watch('field')`처럼 좁혀 쓰고,
> 전체 `watch()`로 폼 전체를 구독하지 않는다.

## 에러 표시 (MUST)

```tsx
function FormErrors() {
  return (
    <>
      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      {errors.root && <p className="text-xs text-destructive">{errors.root.message}</p>}
    </>
  )
}
```

- 필드 에러는 **그 필드 바로 아래**. 폼 전체 에러(`root`)는 제출 버튼 근처.
- 색은 `text-destructive` 토큰 ([14-styling](./14-styling.md)).
- **색만으로 에러를 표현하지 않는다.** 텍스트가 항상 함께 있어야 한다.

## 제출 버튼 (MUST)

```tsx
<Button type="submit" disabled={isSubmitting}>
  로그인
</Button>
```

- **`type="submit"`을 명시한다.**
- **제출 중에는 `disabled`.** 중복 제출을 막는 가장 확실한 방법이다.
- 폼 안의 submit이 아닌 버튼에는 반드시 `type="button"`. 안 그러면 폼이 제출된다.

`isSubmitting`(RHF)과 `mutation.isPending`(Query)은 다른 값이다.
`mutateAsync`를 `handleSubmit` 안에서 await하면 `isSubmitting`이 끝까지 `true`라 이걸 쓰면 된다.

## 인터랙션 일반

### 낙관적 업데이트 (SHOULD)

즉시 반응이 중요한 곳(토글, 좋아요)에만. **실패 시 되돌리기까지 반드시 구현한다.**

```tsx
const mutation = useMutation({
  mutationFn: toggleFavorite,
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['dashboard', 'orders'] })
    const previous = queryClient.getQueryData(['dashboard', 'orders'])
    queryClient.setQueryData(['dashboard', 'orders'], (old) => applyToggle(old, id))
    return { previous }
  },
  onError: (_error, _id, context) => {
    queryClient.setQueryData(['dashboard', 'orders'], context?.previous)
  },
  onSettled: () => {
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 'orders'] })
  },
})
```

되돌리기 없는 낙관적 업데이트는 조용한 데이터 손실이다. 셋을 다 쓰거나 아예 쓰지 않는다.

### 파괴적 동작은 확인을 받는다

삭제·취소·되돌릴 수 없는 것은 `AlertDialog` ([11-overlay](./11-overlay.md)).

### 디바운스

검색 입력 등은 디바운스한다. 타이머는 반드시 정리한다 ([06-react](./06-react.md)).
쿼리 파라미터가 URL에 있으면 `searchParams` 갱신 자체를 디바운스한다.

### 키보드

- 폼은 Enter로 제출되어야 한다 (`<form onSubmit>`을 쓰면 공짜)
- 모달은 ESC로 닫힌다 (Base UI가 처리)
- 커스텀 클릭 요소를 만들지 않는다. `<button>`을 쓰면 Space/Enter가 공짜다

## 체크리스트

- [ ] zod 스키마 + `z.infer` 타입
- [ ] 모든 입력에 `id` / `htmlFor` 연결
- [ ] `type` / `autoComplete` 지정
- [ ] 필드 에러 + `root` 에러 표시
- [ ] 제출 버튼 `type="submit"` + `disabled={isSubmitting}`
- [ ] mutation `onError`에서 `setError`
- [ ] `getByLabelText` / `getByRole`로 테스트 작성
