import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { BookOpen, Check, Copy } from 'lucide-react'
import { useCopyToClipboard } from '@/shared/lib/clipboard'
import { resolvePublicRegistryUrl } from '@/shared/lib/registry-url'

interface GuideSection {
  id: string
  title: string
  description?: string
  steps?: string[]
  code?: string
}

const guideCopy = {
  zh: {
    eyebrow: 'SkillHub 入门文档',
    title: '用户操作指引',
    summary: '按真实使用顺序完成账号注册、命名空间协作、权限申请、技能发布和安装更新。',
    nav: ['注册用户', '创建命名空间', '申请管理员', 'Agent 发布技能', '始终更新 latest', '使用已发布技能'],
    cards: [
      ['注册账号', '先获得可登录的用户身份。', '/register'],
      ['创建命名空间', '为团队或项目建立技能空间。', '/dashboard/namespaces'],
      ['发布技能', '上传技能包并维护版本。', '/dashboard/publish'],
    ],
    sections: [
      {
        id: 'register',
        title: '注册用户',
        steps: [
          '打开 SkillHub 首页，点击右上角“登录”。',
          '选择“注册”，填写用户名、邮箱和密码；如果实例接入企业 SSO，请使用企业登录。',
          '登录成功后进入“控制台”，确认个人信息。',
          '若实例未开放自助注册，请联系平台管理员开通账号。',
        ],
      },
      {
        id: 'namespace',
        title: '创建命名空间',
        steps: [
          '登录后进入“控制台”，打开“命名空间”。',
          '点击“创建命名空间”，填写名称、Slug 和用途描述。',
          'Slug 建议使用小写字母、数字和连字符，例如 kb-ops。',
          '创建后在成员管理中添加协作者，并分配 OWNER、ADMIN 或 MEMBER 角色。',
        ],
      },
      {
        id: 'admin',
        title: '申请管理员',
        description: '命名空间管理员负责团队成员、发布和审核；平台管理员负责全局用户、审计和跨命名空间治理。申请时请说明账号、目标范围、用途和有效期。',
        code: '我申请成为 kb-ops 命名空间 Admin。\n账号：admin-user@example.com\n用途：负责团队成员、技能发布审核和版本治理。\n有效期：长期，由团队负责人定期复核。',
      },
      {
        id: 'agent-publish',
        title: '用 Agent 对话发布技能',
        description: '先在本地准备技能目录，再让 Agent 检查 SKILL.md、排除密钥与临时文件、打包并发布。',
        code: '请帮我发布一个 SkillHub 技能。\n\n本地技能目录：./my-skill\n目标命名空间：kb-ops\n技能版本：1.0.0\n\n发布前检查 SKILL.md 和目录结构，确认没有密钥、token、临时文件或个人隐私信息。发布后确认 latest 指向新版本，并给出普通用户可复制的安装命令。',
      },
      {
        id: 'latest',
        title: '让使用者始终先更新 latest',
        description: '把更新要求写入技能的 SKILL.md。团队日常使用 latest，只有回滚、审计或复现实验时才固定旧版本。',
        code: '## 使用前置步骤\n\n每次执行本技能前，必须先从 SkillHub 更新 latest 版本：\n\n```bash\nclawhub install kb-ops--my-skill@latest --force\n```\n\n更新完成后，重新读取本技能的 SKILL.md，再继续执行用户任务。',
      },
      {
        id: 'consume',
        title: '普通用户如何使用已发布技能',
        steps: [
          '在 SkillHub 搜索技能并打开详情页，检查简介、版本、发布者和审核状态。',
          '复制详情页中的安装命令。',
          '在本地终端或 Agent 对话中执行安装命令。',
          '团队命名空间使用 namespace--skill 的 ClawHub 兼容格式，并在使用前更新 latest。',
        ],
      },
    ] satisfies GuideSection[],
  },
  en: {
    eyebrow: 'SkillHub Getting Started',
    title: 'User Guide',
    summary: 'Follow the real workflow from account registration and namespace access through publishing, installation, and updates.',
    nav: ['Register', 'Create namespace', 'Request admin', 'Publish with an agent', 'Always update latest', 'Use a published skill'],
    cards: [
      ['Register', 'Create an identity that can sign in.', '/register'],
      ['Create namespace', 'Create a skill space for a team or project.', '/dashboard/namespaces'],
      ['Publish skill', 'Upload packages and maintain versions.', '/dashboard/publish'],
    ],
    sections: [
      { id: 'register', title: 'Register a user', steps: ['Open SkillHub and select Login.', 'Choose Register and enter your username, email, and password, or use enterprise SSO when available.', 'After signing in, open Dashboard and verify your profile.', 'Contact the platform administrator when self-registration is disabled.'] },
      { id: 'namespace', title: 'Create a namespace', steps: ['Open Namespaces from Dashboard.', 'Create a namespace and provide its name, slug, and purpose.', 'Use lowercase letters, numbers, and hyphens for the slug, such as kb-ops.', 'Add collaborators and assign OWNER, ADMIN, or MEMBER roles.'] },
      { id: 'admin', title: 'Request administrator access', description: 'Namespace administrators manage team membership, publishing, and reviews. Platform administrators manage global users, auditing, and cross-namespace governance. Include the account, scope, purpose, and duration in your request.', code: 'Please grant Admin access to the kb-ops namespace.\nAccount: admin-user@example.com\nPurpose: manage members, publishing reviews, and version governance.\nDuration: ongoing, reviewed regularly by the team owner.' },
      { id: 'agent-publish', title: 'Publish through an agent conversation', description: 'Prepare the skill directory locally, then ask an agent to validate SKILL.md, exclude secrets and temporary files, package it, and publish it.', code: 'Help me publish a SkillHub skill.\n\nLocal directory: ./my-skill\nTarget namespace: kb-ops\nVersion: 1.0.0\n\nValidate SKILL.md and the package structure. Confirm that no secrets, tokens, temporary files, or personal data are included. After publishing, verify that latest points to the new version and provide a copyable install command.' },
      { id: 'latest', title: 'Always update latest before use', description: 'Put the update requirement in SKILL.md. Use latest for normal team workflows and pin an older version only for rollback, audit, or reproducibility.', code: '## Prerequisite\n\nBefore every run, update the latest version from SkillHub:\n\n```bash\nclawhub install kb-ops--my-skill@latest --force\n```\n\nAfter updating, read SKILL.md again before continuing the task.' },
      { id: 'consume', title: 'Use a published skill', steps: ['Search SkillHub and open the skill detail page.', 'Review its summary, version, publisher, and review status.', 'Copy and run the install command in a terminal or agent conversation.', 'Use the namespace--skill compatibility format for team namespaces and update latest before use.'] },
    ] satisfies GuideSection[],
  },
} as const

function getRegistryUrl() {
  if (typeof window === 'undefined') return 'https://skillhub.example.com'
  return resolvePublicRegistryUrl(window.__SKILLHUB_RUNTIME_CONFIG__?.appBaseUrl, window.location.origin)
}

function CodeBlock({ children }: { children: string }) {
  const { t } = useTranslation()
  const [copied, copy] = useCopyToClipboard()

  return (
    <div className="relative mt-5 overflow-hidden rounded-md bg-slate-950 p-5 pr-14 text-slate-100">
      <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 sm:text-sm">{children}</pre>
      <button
        type="button"
        onClick={() => void copy(children)}
        aria-label={copied ? t('copyButton.copied') : t('copyButton.copy')}
        title={copied ? t('copyButton.copied') : t('copyButton.copy')}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function GuidePage() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.split('-')[0] === 'zh' ? 'zh' : 'en'
  const copy = guideCopy[language]
  const registryUrl = getRegistryUrl()
  const cliCommands = `export CLAWHUB_REGISTRY=${registryUrl}\nclawhub login\nclawhub search keyword\nclawhub install kb-ops--my-skill@latest --force`

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <nav className="sticky top-24 space-y-1 text-sm text-muted-foreground">
          {copy.sections.map((section, index) => <a key={section.id} href={`#${section.id}`} className="block rounded-md px-3 py-2 hover:bg-secondary hover:text-foreground">{copy.nav[index]}</a>)}
        </nav>
      </aside>

      <article className="min-w-0 rounded-md border bg-white px-5 py-8 shadow-sm sm:px-8 lg:px-12 lg:py-10">
        <div className="mb-8 border-b pb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary"><BookOpen className="h-4 w-4" />{copy.eyebrow}</div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">{copy.title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{copy.summary}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {copy.cards.map(([title, description, to]) => (
              <Link key={title} to={to} className="rounded-md border p-4 transition-colors hover:border-primary/30 hover:bg-slate-50">
                <div className="font-semibold text-foreground">{title}</div>
                <div className="mt-1 text-sm leading-5 text-muted-foreground">{description}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          {copy.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-normal text-foreground">{section.title}</h2>
              {section.description ? <p className="mt-4 leading-7 text-muted-foreground">{section.description}</p> : null}
              {section.steps ? (
                <ol className="mt-5 space-y-4">
                  {section.steps.map((step, index) => <li key={step} className="flex gap-3 leading-7 text-foreground"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span><span>{step}</span></li>)}
                </ol>
              ) : null}
              {section.code ? <CodeBlock>{section.code}</CodeBlock> : null}
              {section.id === 'agent-publish' || section.id === 'consume' ? <CodeBlock>{cliCommands}</CodeBlock> : null}
            </section>
          ))}
        </div>
      </article>
    </div>
  )
}
