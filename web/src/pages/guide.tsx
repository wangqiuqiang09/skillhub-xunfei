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

interface GuideCopy {
  eyebrow: string
  title: string
  summary: string
  cards: readonly (readonly [string, string, string])[]
  sections: GuideSection[]
}

const guideCopy = {
  zh: {
    eyebrow: 'SkillHub 入门文档',
    title: 'Agent 用户操作指引',
    summary: '通过 Agent 对话完成技能发现、发布、使用和更新。适合使用 Codex、Claude 桌面版或 Agent 集成的用户。',
    cards: [
      ['发现技能', '搜索和浏览已有技能。', '/'],
      ['发布技能', '通过 Agent 对话发布技能。', '/dashboard/publish'],
      ['使用技能', '让 Agent 安装并使用技能。', ''],
    ],
    sections: [
      {
        id: 'capabilities',
        title: '开始前：确认 Agent 能力',
        description: '本文面向具备终端、文件访问或 SkillHub 集成能力的 Codex、Claude Desktop 及其他 Agent。实际自动化程度取决于客户端提供的工具和授权。',
        steps: [
          '可自动执行：Agent 已获准访问技能目录、运行终端命令和连接 SkillHub，且能通过 npx 调用 clawhub（或已全局安装）。',
          '需要用户确认：发布、覆盖版本、登录、使用 API Token 等会改变外部状态或涉及凭据的操作，应在执行前由用户确认。',
          '仅提供指引：如果 Agent 没有终端、网络或文件权限，它只能生成命令和操作步骤，由用户手动执行。',
          'Claude Desktop 需要配置能够访问文件、终端或 SkillHub 的 MCP/工具；仅有对话能力时不能直接安装或发布。',
        ],
      },
      {
        id: 'register',
        title: '访问技能与注册用户',
        description: '@global 下已发布的 PUBLIC 技能无需登录即可查看、下载和安装。发布技能，或下载团队命名空间及受限技能时，需要登录并具备相应权限。',
        steps: [
          '打开 SkillHub 首页，点击右上角“登录”。',
          '选择“注册”，填写用户名、邮箱和密码；如果实例接入企业 SSO，请使用企业登录。',
          '登录成功后进入“控制台”，确认个人信息。',
          '若实例未开放自助注册，请联系平台管理员开通账号。',
        ],
      },
      {
        id: 'discover',
        title: '发现和搜索技能',
        description: '在 SkillHub 平台上找到你需要的技能，了解功能和使用方法。',
        steps: [
          '使用搜索框查找技能，支持按技能名称、关键词或命名空间搜索。',
          '浏览技能详情页，查看 SKILL.md 了解技能功能、使用方法和前置要求。',
          '检查技能的版本信息和更新时间，优先选择活跃维护的技能。',
          '@global 下的 PUBLIC 技能可以匿名查看、下载和安装；团队命名空间的下载，以及 NAMESPACE_ONLY 和 PRIVATE 技能访问，需要登录且有权限。',
        ],
      },
      {
        id: 'structure',
        title: '技能目录结构',
        description: '根目录中的 SKILL.md 是唯一通用的必需文件，其 YAML frontmatter 必须包含 name 和 description。脚本、依赖清单和资源文件是否需要，取决于技能本身。发布版本由 SkillHub 管理，不要求在 frontmatter 中填写 version。',
        code: 'my-skill/\n├── SKILL.md          # 必需：技能说明和使用指令\n├── scripts/          # 可选：自动化脚本\n├── references/       # 可选：参考资料\n└── assets/           # 可选：模板、图片等资源\n\n# SKILL.md 基本格式\n---\nname: my-skill\ndescription: 简短说明技能做什么，以及何时使用\n---\n\n## 使用方法\n说明 Agent 应如何执行任务。\n\n## 前置要求\n列出所需工具、权限、依赖或配置。\n\n## 限制和注意事项\n说明技能的边界、风险和失败处理方式。',
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
        description: 'Agent 可以先检查和准备发布包。实际发布会写入服务器，必须确认目标服务器、命名空间、版本和文件清单，并在用户明确同意后执行。若缺少工具或权限，Agent 应输出可复制的命令，而不是声称已经发布。',
        code: '请帮我准备并发布一个 SkillHub 技能。\n\n本地技能目录：./my-skill\n目标命名空间：kb-ops\n技能版本：1.0.0\n\n先检查 SKILL.md 和目录结构，列出将要上传的文件，并确认没有密钥、token、临时文件或个人隐私信息。发布前先告诉我目标服务器、命名空间和版本，等我确认后再执行。发布完成后验证版本状态和 latest 指向，并给出普通用户可复制的安装命令。',
      },
      {
        id: 'latest',
        title: '让使用者始终先更新 latest',
        description: '把版本检查规则写入技能的 SKILL.md。网络和权限允许时必须更新 latest；检查或更新失败时可以继续使用本地版本，但必须向用户提示失败，且不能声称本地版本是最新版本。',
        code: '## 使用前置检查\n\n每次使用本技能处理任务前，必须优先检查 SkillHub 上是否存在新版本。\n\n1. 尝试连接 SkillHub 并检查本技能的最新已发布版本。\n2. 如果存在新版本，更新到 `latest`。\n3. 更新成功后，必须重新读取新版 `SKILL.md`，再执行用户任务。若当前客户端不会自动重载技能，则停止当前流程并提示用户重新开始任务。\n4. 如果因为断网、超时、服务不可用或权限不足导致检查或更新失败：\n   - 继续使用当前本地版本完成任务；\n   - 在任务结果中明确提示“版本检查失败，本次使用本地版本”；\n   - 不得声称当前版本是最新版本；\n   - 不得反复重试或阻塞用户任务。\n\n```bash\nnpx clawhub install kb-ops--my-skill@latest --force\n```\n\n失败提示：版本检查失败，当前无法连接 SkillHub 或完成更新，本次任务继续使用本地版本；当前版本可能不是最新版本。',
      },
      {
        id: 'agent-use',
        title: '通过 Agent 使用技能',
        description: '具备所需工具和权限的 Agent 可以安装并使用技能；否则它应说明缺少什么能力，并给出手动操作步骤。更新成功后必须重新读取 SKILL.md。',
        code: '请使用 kb-ops--my-skill@latest 技能来帮我处理以下任务：\n\n[描述你的具体任务]\n\n使用前请：\n1. 说明你是否具备终端、网络和技能目录访问能力\n2. 检查 SkillHub 上是否有新版本；如果有，更新到 latest\n3. 更新后重新读取技能的 SKILL.md；无法自动重载时提示我重新开始任务\n4. 按照技能文档执行任务\n5. 如果无法安装或更新，说明原因并给出可复制的手动命令\n\n# 对话示例\n用户：请使用 kb-ops--log-parser 技能帮我分析这个日志文件。\n\nAgent：我会先确认工具与权限，检查技能版本，读取当前 SKILL.md，再按照其中的要求处理日志。',
      },
      {
        id: 'troubleshooting',
        title: '常见问题排查',
        description: '发布和使用技能时可能遇到的问题及解决方法。',
        steps: [
          '**权限错误 (403)**：检查是否登录，是否有命名空间的相应权限。PRIVATE 和 NAMESPACE_ONLY 技能需要授权。',
          '**发布失败**：确认 SKILL.md 格式正确，目录结构符合要求，没有包含密钥或临时文件。',
          '**安装失败**：检查网络连接和技能坐标。@global 下的 PUBLIC 技能可以匿名安装；团队命名空间或受限技能需要登录。',
          '**版本检查失败**：网络问题或服务暂时不可用，Agent 会使用本地版本继续任务，并提示失败信息。',
          '**Agent 无法找到技能**：确认技能名称正确，包括命名空间前缀（如 kb-ops--my-skill），搜索技能详情页确认准确名称。',
        ],
        code: '# 权限错误解决\nnpx clawhub login --token sk_your_api_token_here\n\n# 重新安装技能\nnpx clawhub install kb-ops--my-skill@latest --force\n\n# 检查已安装技能\nnpx clawhub list\n\n# 查看技能详情\ncat ~/.clawhub/skills/kb-ops--my-skill/SKILL.md',
      },
    ] satisfies GuideSection[],
  },
  en: {
    eyebrow: 'SkillHub Getting Started',
    title: 'Agent User Guide',
    summary: 'Discover, publish, use, and update skills through agent conversations. For users of Codex, Claude Desktop, or agent integrations.',
    cards: [
      ['Discover skills', 'Search and browse available skills.', '/'],
      ['Publish skill', 'Publish skills through agent conversations.', '/dashboard/publish'],
      ['Use skills', 'Let agents install and use skills.', ''],
    ],
    sections: [
      { id: 'capabilities', title: 'Before you begin: check agent capabilities', description: 'This guide is for Codex, Claude Desktop, and other agents with terminal, file access, or SkillHub integration. The available automation depends on the tools and permissions exposed by the client.', steps: ['Automatic: the agent can access the skill directory, run terminal commands, reach SkillHub, and invoke clawhub through npx (or a global installation).', 'User confirmation required: publishing, overwriting a version, signing in, and using API tokens affect external state or credentials and require confirmation before execution.', 'Guidance only: without terminal, network, or file access, the agent can provide commands and steps but cannot claim to have installed or published anything.', 'Claude Desktop needs suitable MCP servers or tools for filesystem, terminal, or SkillHub access; a chat-only setup cannot install or publish directly.'] },
      { id: 'register', title: 'Access skills and register', description: 'Published PUBLIC skills under @global can be viewed, downloaded, and installed anonymously. Sign-in and suitable permissions are required for publishing and for downloading team-namespace or restricted skills.', steps: ['Open SkillHub and select Login.', 'Choose Register and enter your username, email, and password, or use enterprise SSO when available.', 'After signing in, open Dashboard and verify your profile.', 'Contact the platform administrator when self-registration is disabled.'] },
      {
        id: 'discover',
        title: 'Discover and search skills',
        description: 'Find the skills you need on SkillHub and learn about their functionality.',
        steps: [
          'Use the search box to find skills by name, keywords, or namespace.',
          'Browse skill details and read SKILL.md to understand functionality, usage, and prerequisites.',
          'Check version information and update dates; prioritize actively maintained skills.',
          'PUBLIC skills under @global can be viewed, downloaded, and installed anonymously. Team-namespace downloads and NAMESPACE_ONLY or PRIVATE access require authentication and authorization.',
        ],
      },
      {
        id: 'structure',
        title: 'Skill directory structure',
        description: 'SKILL.md at the package root is the only universally required file. Its YAML frontmatter requires name and description. Scripts, dependency manifests, and assets are skill-specific. SkillHub manages publication versions, so version is not required in frontmatter.',
        code: 'my-skill/\n├── SKILL.md          # Required: instructions and documentation\n├── scripts/          # Optional: automation scripts\n├── references/       # Optional: reference material\n└── assets/           # Optional: templates, images, and resources\n\n# Basic SKILL.md format\n---\nname: my-skill\ndescription: What the skill does and when to use it\n---\n\n## Usage\nExplain how the agent should perform the task.\n\n## Prerequisites\nList required tools, permissions, dependencies, or configuration.\n\n## Limitations\nDocument boundaries, risks, and failure handling.',
      },
      { id: 'namespace', title: 'Create a namespace', steps: ['Open Namespaces from Dashboard.', 'Create a namespace and provide its name, slug, and purpose.', 'Use lowercase letters, numbers, and hyphens for the slug, such as kb-ops.', 'Add collaborators and assign OWNER, ADMIN, or MEMBER roles.'] },
      { id: 'admin', title: 'Request administrator access', description: 'Namespace administrators manage team membership, publishing, and reviews. Platform administrators manage global users, auditing, and cross-namespace governance. Include the account, scope, purpose, and duration in your request.', code: 'Please grant Admin access to the kb-ops namespace.\nAccount: admin-user@example.com\nPurpose: manage members, publishing reviews, and version governance.\nDuration: ongoing, reviewed regularly by the team owner.' },
      { id: 'agent-publish', title: 'Publish through an agent conversation', description: 'An agent can validate and prepare the package first. Publishing writes to the server, so it must show the server, namespace, version, and file list and wait for explicit user confirmation. If tools or permissions are missing, it should provide commands instead of claiming success.', code: 'Help me prepare and publish a SkillHub skill.\n\nLocal directory: ./my-skill\nTarget namespace: kb-ops\nVersion: 1.0.0\n\nValidate SKILL.md and the package structure, list the files to upload, and confirm that no secrets, tokens, temporary files, or personal data are included. Show me the target server, namespace, and version, then wait for my confirmation before publishing. After publishing, verify the version status and latest pointer, and provide a copyable install command.' },
      { id: 'latest', title: 'Always check latest before use', description: 'Put the version policy in SKILL.md. Update latest when network access and permissions allow it. If the check or update fails, continue with the local version, warn the user, and never claim that it is current.', code: '## Version check before use\n\nBefore every task, check SkillHub for a newer published version.\n\n1. Try to connect to SkillHub and check the latest published version.\n2. Update to `latest` when a newer version exists.\n3. After a successful update, read the new `SKILL.md` before executing the task. If the client cannot reload skills automatically, stop and ask the user to restart the task.\n4. If the check or update fails because of network, timeout, service, or permission errors:\n   - continue the task with the current local version;\n   - report that the version check failed and the local version is being used;\n   - do not claim that the local version is current;\n   - do not repeatedly retry or block the user task.\n\n```bash\nnpx clawhub install kb-ops--my-skill@latest --force\n```\n\nFailure notice: Version check failed. SkillHub could not be reached or the update could not be completed. This task will use the local version, which may not be current.' },
      {
        id: 'agent-use',
        title: 'Use skills through agents',
        description: 'Agents with the required tools and permissions can install and use skills. Otherwise, they should identify the missing capability and provide manual steps. They must reread SKILL.md after an update.',
        code: 'Please use the kb-ops--my-skill@latest skill to help me with the following task:\n\n[Describe your specific task]\n\nBefore using it:\n1. State whether you have terminal, network, and skill-directory access\n2. Check SkillHub for an update and install latest when available\n3. Reread SKILL.md after updating; ask me to restart the task if you cannot reload it\n4. Follow the skill instructions to execute the task\n5. If installation or update is unavailable, explain why and provide a copyable manual command',
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        description: 'Common issues when publishing and using skills, and how to resolve them.',
        steps: [
          '**Permission errors (403)**: Verify you\'re logged in and have the appropriate namespace permissions. PRIVATE and NAMESPACE_ONLY skills require authorization.',
          '**Publish failures**: Confirm SKILL.md format is correct, directory structure meets requirements, and no secrets or temporary files are included.',
          '**Install failures**: Check network connectivity and the skill coordinate. PUBLIC skills under @global install anonymously; team-namespace or restricted skills require authentication.',
          '**Version check failures**: Network issues or temporary service unavailability. The agent will continue with the local version and report the failure.',
          '**Agent cannot find skill**: Confirm the skill name is correct, including the namespace prefix (e.g., kb-ops--my-skill). Search the skill detail page to verify the exact name.',
        ],
        code: '# Resolve permission errors\nnpx clawhub login --token sk_your_api_token_here\n\n# Reinstall skill\nnpx clawhub install kb-ops--my-skill@latest --force\n\n# List installed skills\nnpx clawhub list\n\n# View skill details\ncat ~/.clawhub/skills/kb-ops--my-skill/SKILL.md',
      },
    ] satisfies GuideSection[],
  },
} satisfies Record<'zh' | 'en', GuideCopy>

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

function StepText({ children }: { children: string }) {
  const match = children.match(/^\*\*(.+?)\*\*(.*)$/)
  if (!match) return children

  return <><strong>{match[1]}</strong>{match[2]}</>
}

export function GuidePage() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.split('-')[0] === 'zh' ? 'zh' : 'en'
  const copy = guideCopy[language]
  const registryUrl = getRegistryUrl()
  const publishCommands = `export CLAWHUB_REGISTRY=${registryUrl}\nnpx clawhub login\nnpx clawhub publish ./my-skill --namespace kb-ops`

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <nav className="sticky top-24 space-y-1 text-sm text-muted-foreground">
          {copy.sections.map((section) => <a key={section.id} href={`#${section.id}`} className="block rounded-md px-3 py-2 hover:bg-secondary hover:text-foreground">{section.title}</a>)}
        </nav>
      </aside>

      <article className="min-w-0 rounded-md border bg-white px-5 py-8 shadow-sm sm:px-8 lg:px-12 lg:py-10">
        <div className="mb-8 border-b pb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary"><BookOpen className="h-4 w-4" />{copy.eyebrow}</div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">{copy.title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{copy.summary}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {copy.cards.map(([title, description, to]) => to ? (
              <Link key={title} to={to} className="rounded-md border p-4 transition-colors hover:border-primary/30 hover:bg-slate-50">
                <div className="font-semibold text-foreground">{title}</div>
                <div className="mt-1 text-sm leading-5 text-muted-foreground">{description}</div>
              </Link>
            ) : (
              <div key={title} className="rounded-md border p-4">
                <div className="font-semibold text-foreground">{title}</div>
                <div className="mt-1 text-sm leading-5 text-muted-foreground">{description}</div>
              </div>
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
                  {section.steps.map((step, index) => <li key={step} className="flex gap-3 leading-7 text-foreground"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span><span><StepText>{step}</StepText></span></li>)}
                </ol>
              ) : null}
              {section.code ? <CodeBlock>{section.code}</CodeBlock> : null}
              {section.id === 'agent-publish' ? <CodeBlock>{publishCommands}</CodeBlock> : null}
            </section>
          ))}
        </div>
      </article>
    </div>
  )
}
