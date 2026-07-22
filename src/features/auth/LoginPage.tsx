import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { setAccessToken } from '@/api/tokenStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/features/auth/api'
import { useAuthStore } from '@/features/auth/store'

const schema = z.object({
  email: z.email('올바른 이메일을 입력하세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
})

type FormValues = z.infer<typeof schema>

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const status = useAuthStore((s) => s.status)
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ accessToken, user }) => {
      setAccessToken(accessToken)
      setAuthenticated(user)
      const from = (location.state as LocationState | null)?.from?.pathname ?? '/'
      void navigate(from, { replace: true })
    },
    onError: (error: Error) => {
      setError('root', { message: error.message })
    },
  })

  if (status === 'authenticated') return <Navigate to="/" replace />

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {/* shadcn CardTitle은 div라서 heading 시맨틱이 없다.
              로그인은 페이지 제목이므로 스크린리더가 인식하도록 role을 준다. */}
          <CardTitle role="heading" aria-level={1}>
            로그인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              void handleSubmit((values) => mutation.mutateAsync(values))(e)
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {errors.root && <p className="text-xs text-destructive">{errors.root.message}</p>}

            <Button type="submit" disabled={isSubmitting}>
              로그인
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
