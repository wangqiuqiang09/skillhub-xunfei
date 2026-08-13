import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: unknown }) => children,
}))

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { resolvedLanguage: 'zh' }
    })
  }
})

vi.mock('@/shared/lib/clipboard', () => ({ useCopyToClipboard: () => [false, vi.fn()] }))

import { GuidePage } from './guide'

describe('GuidePage', () => {
  it('renders capability, package, authorization, and update guidance', () => {
    const html = renderToStaticMarkup(<GuidePage />)
    expect(html).toContain('Agent 用户操作指引')
    expect(html).toContain('确认 Agent 能力')
    expect(html).toContain('需要用户确认')
    expect(html).toContain('Claude Desktop')
    expect(html).toContain('发现和搜索技能')
    expect(html).toContain('技能目录结构')
    expect(html).toContain('唯一通用的必需文件')
    expect(html).not.toContain('package.json')
    expect(html).not.toContain('version: 1.0.0')
    expect(html).toContain('通过 Agent 使用技能')
    expect(html).toContain('常见问题排查')
    expect(html).toContain('kb-ops--my-skill@latest')
    expect(html).toContain('SKILL.md')
    expect(html).toContain('版本检查失败')
    expect(html.match(/id="admin"/g)).toHaveLength(1)
  })
})
