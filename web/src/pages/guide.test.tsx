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
    expect(html).toContain('版本检查失败，本次使用本地版本')
    expect(html).toContain('PUBLIC 技能可匿名浏览、下载和安装')
    expect(html).toContain('@global 下的 PUBLIC 技能：无需登录')
  })
})
