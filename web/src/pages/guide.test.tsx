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
  const html = renderToStaticMarkup(<GuidePage />)

  it('renders the layered structure: quick start + three role tracks', () => {
    expect(html).toContain('新手使用指南')
    expect(html).toContain('3 分钟上手')
    expect(html).toContain('我要用技能')
    expect(html).toContain('我要发技能')
    expect(html).toContain('我要管团队')
    // three role tabs are all rendered
    expect(html).toContain('使用者')
    expect(html).toContain('发布者')
    expect(html).toContain('管理员')
  })

  it('renders a complete AI install contract with an explicit non-interactive target', () => {
    expect(html).toContain('https://skillhub.example.com/registry/skill.md')
    expect(html).toContain('npx @astron-team/skillhub@latest install skillhub-hello --scope user --agent codex --registry https://skillhub.example.com')
    expect(html).toContain('安装的坐标、版本、目录')
    expect(html).toContain('不要登录，也不要索取 Token')
    expect(html).not.toContain('{{REGISTRY_URL}}')
    expect(html).not.toContain('hello-world')
  })

  it('uses copyable npx commands and documents credential cleanup', () => {
    expect(html).toContain('npx @astron-team/skillhub@latest install')
    expect(html).toContain('npx @astron-team/skillhub@latest publish')
    expect(html).toContain('npx @astron-team/skillhub@latest login')
    expect(html).toContain('npx @astron-team/skillhub@latest logout')
    expect(html).not.toContain('clawhub')
    expect(html).not.toContain('--no-browser')
    expect(html).not.toContain('--slug')
    expect(html).toContain('search skillhub-hello --registry https://skillhub.example.com')
    expect(html).toContain('install skillhub-hello --version 1.0.0 --scope user --agent codex --force')
  })

  it('references images from /guide-assets/, not the broken /guide/ path', () => {
    expect(html).toContain('/guide-assets/homepage.png')
    expect(html).toContain('/guide-assets/skill-detail-star.png')
    expect(html).not.toContain('src="/guide/')
  })

  it('covers each role track with the expected sections', () => {
    // user track (default visible)
    expect(html).toContain('发现和搜索技能')
    expect(html).toContain('安装公开技能')
    expect(html).toContain('通过 Agent 使用技能')
    expect(html).toContain('保持技能最新')
    expect(html).toContain('访问受限技能')
    expect(html).toContain('常见问题')
    // publisher track
    expect(html).toContain('技能目录结构')
    expect(html).toContain('进阶：让技能检查更新')
    expect(html).toContain('登录并发布')
    expect(html).toContain('理解审核状态')
    // admin track
    expect(html).toContain('创建命名空间')
    expect(html).toContain('成员与角色')
    expect(html).toContain('审核与上线')
  })

  it('keeps the key correctness concepts and unique section ids', () => {
    expect(html).toContain('PENDING_REVIEW')
    expect(html).toContain('SUPER_ADMIN')
    expect(html).toContain('SKILL.md')
    expect(html).toContain('版本检查失败')
    expect(html).toContain('401')
    // quickstart id is unique; role section ids are prefixed
    expect(html.match(/id="quickstart"/g)).toHaveLength(1)
    expect(html.match(/id="admin-review"/g)).toHaveLength(1)
    expect(html.match(/id="publisher-review"/g)).toHaveLength(1)
  })

  it('renders a right-hand table of contents for the active role', () => {
    expect(html).toContain('本页目录')
    // quickstart and the active (user) role sections are linked in the TOC
    expect(html).toContain('href="#quickstart"')
    expect(html).toContain('href="#user-discover"')
    expect(html).toContain('href="#user-install"')
    // other roles' sections are present (hidden) but not linked in the TOC
    expect(html).not.toContain('href="#publisher-sync"')
    expect(html).not.toContain('href="#admin-review"')
  })

  it('documents the version-sync prerequisite on the publisher track', () => {
    expect(html).toContain('进阶：让技能检查更新')
    expect(html).toContain('版本检查失败')
    // the skillhub update pitfall is called out
    expect(html).toContain('skillhub update 只更新 skillhub CLI 自身')
    // skillhub install --force is the documented update path
    expect(html).toContain('install --force')
  })

  it('guides beginners to get an API token and publish via an agent', () => {
    // the token-creation path is spelled out for newcomers
    expect(html).toContain('创建 API Token')
    expect(html).toContain('访问凭证')
    // publishing can be driven by an agent prompt
    expect(html).toContain('整段交给 Agent')
    // the prompt accepts a dedicated single-use token
    expect(html).toContain('SKILLHUB_TOKEN')
    expect(html).toContain('一次性 Token')
    expect(html).toContain('不得仅因 Token 出现在本次对话中停止')
    expect(html).toContain('能力披露')
    expect(html).toContain('越界或不可逆删除')
    expect(html).toContain('目标命名空间固定为 global，可见性固定为 public')
    expect(html).toContain('无需再次询问确认')
    expect(html).toContain('npx @astron-team/skillhub@latest publish')
    expect(html).toContain('--namespace global --visibility public --registry')
    expect(html).toContain('删除本次一次性 Token')
  })

  it('documents public visibility, private latest, and the real namespace entry', () => {
    expect(html).toContain('所有命名空间中的 PUBLIC 技能都可匿名')
    expect(html).toContain('PRIVATE 的 latest 指向最新上传版本')
    expect(html).toContain('右上角头像菜单')
    expect(html).toContain('用途描述可选')
  })

  it('renders role cards as actionable path buttons', () => {
    expect(html).toContain('aria-label="选择你的使用路径"')
    expect(html).toContain('aria-pressed="true"')
  })
})
