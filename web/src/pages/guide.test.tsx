import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: unknown }) => children,
}))

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')
  return { ...actual, useTranslation: () => ({ t: (key: string) => key, i18n: { resolvedLanguage: 'zh' } }) }
})

vi.mock('@/shared/lib/clipboard', () => ({ useCopyToClipboard: () => [false, vi.fn()] }))

import { GuidePage } from './guide'

describe('GuidePage', () => {
  it('renders the chinese onboarding workflow and canonical team slug', () => {
    const html = renderToStaticMarkup(<GuidePage />)
    expect(html).toContain('用户操作指引')
    expect(html).toContain('Agent 对话发布技能')
    expect(html).toContain('kb-ops--my-skill@latest')
  })
})
