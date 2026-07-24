import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'playwright-report', 'public'] },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.browser,
    },
    plugins: {
      import: importPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      // `@/`를 import/order의 'internal' 그룹으로 분류한다.
      'import/internal-regex': '^@/',
      // 이게 없으면 eslint-plugin-import가 .ts/.tsx의 export 목록을 못 읽는다.
      // export map에 의존하는 규칙(no-named-as-default-member 등)이 조용히 통과한다.
      'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import/extensions': ['.ts', '.tsx', '.js', '.jsx'],
      // 루트 tsconfig는 references만 갖고 있어 3개 프로젝트를 모두 따라간다.
      // 하위 tsconfig를 나열하면 "Multiple projects found" 경고가 난다.
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'no-underscore-dangle': ['warn', { allow: ['_retried'] }],

      // /////////////////////////////////////////////////////////////////////////
      // `import/recommended`
      // @see https://github.com/import-js/eslint-plugin-import
      // /////////////////////////////////////////////////////////////////////////
      // import : 빈 블럭으로 가져오기 금지
      'import/no-empty-named-blocks': 'error',
      // export : var, let 금지
      'import/no-mutable-exports': 'error',
      // import : 가져온 모듈을 선택자로 사용 금지
      'import/no-named-as-default-member': 'error',
      // import : require, define 사용 금지
      'import/no-amd': 'error',
      // export : default export 선호 끄기
      'import/prefer-default-export': 'off',
      // 로컬 파일시스템의 모듈로 확인될 수 있는지 확인 끔
      'import/no-unresolved': 'off',
      // import 확장자 사용
      // 원본은 Vue 기준({ vue: 'always' })이었다. TS 소스는 확장자를 쓰지 않는 게 관례라
      // ts/tsx만 'never'로 두고, css·svg 같은 자산은 확장자 필수를 유지한다.
      'import/extensions': ['error', 'ignorePackages', { ts: 'never', tsx: 'never' }],
      // import 상대경로 금지
      'no-restricted-imports': [
        'error',
        {
          patterns: ['.*'],
        },
      ],
      // 의존 방향 강제: shared → features → app
      // @see docs/conventions/01-folder-structure.md
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // feature 는 다른 feature 를 모른다.
            { target: './src/features/auth', from: './src/features', except: ['./auth'] },
            {
              target: './src/features/dashboard',
              from: './src/features',
              except: ['./dashboard'],
            },
            // 역방향 금지. app 은 features 를 알지만 그 반대는 아니다.
            { target: './src/features', from: './src/app' },
            { target: './src/shared', from: ['./src/features', './src/app'] },
          ],
        },
      ],
      // import 순서
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          // 오름차순 정렬, 대소문자 구분 하지 않음
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
      // import 정렬
      'sort-imports': [
        'error',
        {
          // 대문자 무시
          ignoreCase: true,
          // 변수나 함수의 순서가 import 정렬에 영향을 미치지 않음
          ignoreDeclarationSort: true,
          // 멤버 정렬 무시
          ignoreMemberSort: false,
          // 그룹화
          allowSeparatedGroups: true,
        },
      ],
    },
  },

  {
    // shadcn이 생성/갱신하는 파일. 직접 수정하지 않으므로 규칙을 끈다.
    files: ['src/shared/components/ui/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
      'no-shadow': 'off',
    },
  },

  {
    // feature 공개 API. 컴포넌트와 훅을 같이 내보내는 게 목적인 파일이다.
    files: ['src/features/*/index.ts'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'src/testing/**', 'e2e/**'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },

  {
    // e2e는 별도 tsconfig라 `@/` alias가 없다. 상대경로가 유일한 선택지다.
    files: ['e2e/**', 'playwright.config.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },

  {
    files: ['src/config/env.ts'],
    rules: { 'no-console': 'off' },
  },

  {
    files: ['vite.config.ts', 'playwright.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
)
