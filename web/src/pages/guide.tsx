import { type MouseEvent, useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { BookOpen, Check, Copy } from 'lucide-react'
import { useCopyToClipboard } from '@/shared/lib/clipboard'
import { cn } from '@/shared/lib/utils'
import { withBasePath } from '@/shared/lib/base-path'
import { resolvePublicRegistryUrl } from '@/shared/lib/registry-url'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'

interface GuideImage {
  src: string
  alt: string
  caption: string
}

interface GuideSection {
  id: string
  title: string
  description?: string
  steps?: string[]
  code?: string
  image?: GuideImage
}

interface RoleGuide {
  label: string
  summary: string
  sections: GuideSection[]
}

interface GuideCopy {
  eyebrow: string
  title: string
  summary: string
  cards: readonly (readonly [string, string])[]
  quickstart: GuideSection
  roles: Record<Role, RoleGuide>
}

const REGISTRY_URL_PLACEHOLDER = '{{REGISTRY_URL}}'
const ROLE_ORDER = ['user', 'publisher', 'admin'] as const
type Role = (typeof ROLE_ORDER)[number]

const AI_INSTALL_PROMPT_ZH = `请安装并准备使用 SkillHub 入门技能 @global/skillhub-hello。

执行要求：
1. 先阅读 {{REGISTRY_URL}}/registry/skill.md，并以该说明为准。
2. 确认你具备终端、网络和技能目录写入权限；缺少能力时停止并告诉我需要手动执行什么。
3. 这是 PUBLIC 技能，不要登录，也不要索取 Token。
4. 先运行 npx @astron-team/skillhub@latest search skillhub-hello --registry {{REGISTRY_URL}}。只有结果包含 global/skillhub-hello 时才继续；若不存在，停止并让我从技能市场选择一个真实 PUBLIC 坐标。
5. 使用当前 Agent 对应的明确安装目标，避免交互选择。Codex 的示例命令：
   npx @astron-team/skillhub@latest install skillhub-hello --scope user --agent codex --registry {{REGISTRY_URL}}
   如果你不是 Codex，请把 codex 换成自己的有效 profile；无法确定时先运行 npx @astron-team/skillhub@latest help install，不要猜目录。
6. 以安装命令成功并输出安装目录为完成标准。安装后读取该目录中的 SKILL.md。
7. 最后只报告：安装的坐标、版本、目录，以及是否已成功读取 SKILL.md；失败时给出原始错误和下一步。`

const AI_INSTALL_PROMPT_EN = `Install and prepare to use the SkillHub starter skill @global/skillhub-hello.

Requirements:
1. Read {{REGISTRY_URL}}/registry/skill.md first and follow it as the source of truth.
2. Confirm that you have terminal, network, and skill-directory write access. Stop and tell me what I must run manually if a capability is missing.
3. This is a PUBLIC skill. Do not sign in or request a token.
4. Run npx @astron-team/skillhub@latest search skillhub-hello --registry {{REGISTRY_URL}} first. Continue only if the result includes global/skillhub-hello. If it is absent, stop and ask me to select a real PUBLIC coordinate from the marketplace.
5. Use an explicit install target to avoid interactive selection. Example for Codex:
   npx @astron-team/skillhub@latest install skillhub-hello --scope user --agent codex --registry {{REGISTRY_URL}}
   If you are not Codex, replace codex with your valid profile. If unsure, run npx @astron-team/skillhub@latest help install first; do not guess a directory.
6. Treat a successful install command that reports an install directory as completion, then read SKILL.md from that directory.
7. Finally report only the coordinate, version, install directory, and whether SKILL.md was read. On failure, include the original error and the next action.`

const guideCopy = {
  zh: {
    eyebrow: 'SkillHub 入门文档',
    title: '新手使用指南',
    summary: '按你的角色找到起步路径。先用 3 分钟匿名跑通一个公开技能，再进入使用者、发布者或管理员的详细指引。',
    cards: [
      ['我要用技能', '搜索、安装并通过 Agent 运行技能。'],
      ['我要发技能', '打包、发布并分享你的技能。'],
      ['我要管团队', '管理命名空间、成员与审核。'],
    ],
    quickstart: {
      id: 'quickstart',
      title: '3 分钟上手（所有角色）',
      description: '不需要登录。所有 PUBLIC 技能都可匿名查看、下载和安装；@global 只是下面示例使用的默认命名空间。坐标是技能的唯一名称，格式为「@命名空间/技能名」。',
      steps: [
        '在「技能市场」搜索内置入门技能 skillhub-hello，打开它的详情页。若实例关闭了内置技能，则选择市场中任一 PUBLIC 技能并替换下方坐标。',
        '在详情页的「安装」区域复制 AI Prompt。它包含说明地址、技能坐标和一句安装指令，不含 Token 等敏感参数。',
        '把 Prompt 粘给具备终端、网络和技能目录权限的 Agent。AI 应明确安装目标、执行安装、读取 SKILL.md，再报告结果。',
        '匿名安装不要先调用登录接口；/api/v1/auth/me 返回 401 只代表当前未登录，不代表安装失败。',
      ],
      code: AI_INSTALL_PROMPT_ZH,
      image: {
        src: '/guide-assets/homepage.png',
        alt: 'SkillHub 首页的 Agent 与用户快速开始入口',
        caption: '首页提供 Agent / Human / CLI 三种入口；Agent 入口会生成指向当前服务器的 Registry 配置 Prompt。',
      },
    },
      roles: {
      user: {
        label: '使用者',
        summary: '找到、安装并通过 Agent 使用技能。',
        sections: [
          {
            id: 'account',
            title: '注册账号并生成 API Token',
            description: '公开技能可以匿名安装；注册账号和 API Token 用于访问受限技能、发布技能以及调用需要认证的 API。Token 只在创建成功后显示一次。',
            steps: [
              '打开右上角「登录」，在登录页选择「注册」；也可以直接访问 /register。若实例启用了企业 SSO，可切换到 OAuth 注册/登录。',
              '填写用户名、邮箱和密码。默认仅支持 @x-sense.com 邮箱，管理员可通过部署环境变量调整；用户名为 3–64 位字母、数字或下划线，密码为 6–128 位。',
              '提交后进入「控制台」，打开「访问凭证」卡片，点击「查看 API Tokens」，再点击「创建 API Token」。',
              '为 Token 填写便于识别的名称（最多 64 个字符），选择永不过期、7 天、30 天、90 天或自定义过期时间，然后创建。',
              '创建成功后立即点击复制并保存完整的 sk_... 值。关闭弹窗后无法再次查看原始 Token；不要把它提交到 Git、日志或技能包中。',
              '不再使用时，在 API Tokens 列表中撤销/删除对应 Token。权限变更、设备丢失或人员离开团队时应立即撤销。',
            ],
            code: '# 将 Token 放入环境变量，避免写入脚本、配置或 Git\nexport SKILLHUB_TOKEN="sk_..."\nnpx @astron-team/skillhub@latest login --token "$SKILLHUB_TOKEN" --registry {{REGISTRY_URL}}\nnpx @astron-team/skillhub@latest whoami --registry {{REGISTRY_URL}}\n\n# 完成 CLI 操作后清除本机凭据\nnpx @astron-team/skillhub@latest logout --registry {{REGISTRY_URL}}',
            image: {
              src: '/guide-assets/homepage.png',
              alt: 'SkillHub 首页登录入口',
              caption: '从首页右上角登录进入账号流程；登录后在控制台的「访问凭证」中管理 API Token。',
            },
          },
          {
            id: 'discover',
            title: '发现和搜索技能',
            description: '在 SkillHub 上找到需要的技能，了解它的功能和使用方法。',
            steps: [
              '使用搜索框，按技能名称、关键词或命名空间查找。',
              '打开技能详情页，阅读 SKILL.md 了解功能、使用方法和前置要求。',
              '查看版本信息和更新时间，优先选择活跃维护的技能。',
              '所有命名空间中的 PUBLIC 技能都可匿名查看、下载和安装；NAMESPACE_ONLY 和 PRIVATE 技能需要登录且有权限。',
            ],
            image: {
              src: '/guide-assets/skill-discovery-search.png',
              alt: 'SkillHub 技能搜索页面',
              caption: '可从首页搜索或热门下载进入技能详情页；版本、命名空间和 SKILL.md 以详情页信息为准。',
            },
          },
          {
            id: 'install',
            title: '安装公开技能',
            description: '详情页默认提供 AI Prompt，也可切换到 CLI。所有 PUBLIC 技能无需登录。新手优先把 Prompt 交给有终端能力的 Agent；手动执行时必须指定 registry 和安装目标。',
            steps: [
              '复制 AI Prompt 给 Agent。Prompt 包含说明地址和完整坐标，Agent 会从所链接的协议读取安装要求；Prompt 不包含 Token。',
              '坐标规则：@global/my-skill 对应 my-skill；@team-name/my-skill 对应 team-name--my-skill。不要写成 @global--my-skill。',
              'CLI 默认安装最新可访问版本；指定版本用 --version，不要用 name@version 后缀。PUBLIC/NAMESPACE_ONLY 的 latest 随 PUBLISHED 更新；PRIVATE 的 latest 指向最新上传版本。',
              '非交互执行必须明确目标：使用 --scope 配合 --agent，或直接传 --dir。仅传 --scope 时若发现多个 Agent，仍可能报 multiple install targets detected。',
              '安装结果以 CLI 或下载请求本身为准；/api/v1/auth/me 返回 401 只表示未登录。',
            ],
            code: '# 以下 skillhub-hello 命令可直接执行；示例目标为 Codex 用户级目录\nnpx @astron-team/skillhub@latest search skillhub-hello --registry {{REGISTRY_URL}}\nnpx @astron-team/skillhub@latest install skillhub-hello --scope user --agent codex --registry {{REGISTRY_URL}}\n\n# 固定版本示例（内置初始版本）\nnpx @astron-team/skillhub@latest install skillhub-hello --version 1.0.0 --scope user --agent codex --force --registry {{REGISTRY_URL}}\n\n# 也可用 --dir /明确/目录 代替 --scope 与 --agent；非 Codex 请替换 profile',
            image: {
              src: '/guide-assets/skill-detail-star.png',
              alt: '技能详情页的安装入口和文件浏览',
              caption: '右侧先显示安装区域，其下方是文件浏览；可复制 AI Prompt 或 CLI 命令。',
            },
          },
          {
            id: 'use',
            title: '通过 Agent 使用技能',
            description: '具备所需工具和权限的 Agent 可以安装并使用技能；否则它应说明缺少什么能力，并给出手动步骤。更新成功后必须重新读取 SKILL.md。',
            code: '请使用 team-name--my-skill 技能帮我处理以下任务：\n\n[描述你的具体任务]\n\n使用前请：\n1. 说明你是否具备终端、网络和技能目录访问能力\n2. 检查 SkillHub 上是否有新版本；如果有，更新到最新版\n3. 更新后重新读取技能的 SKILL.md；无法自动重载时提示我重新开始任务\n4. 按照技能文档执行任务\n5. 如果无法安装或更新，说明原因并给出可复制的手动命令',
          },
          {
            id: 'update',
            title: '保持技能最新',
            description: '使用者只需要求 Agent 在执行前检查版本。具体的可复用版本同步模板放在发布者轨道，避免在多处维护同一规则。检查失败时可继续使用本地版本，但 Agent 必须明确提示失败。',
            code: '使用技能前，请按注册中心说明检查更新。更新成功后重新读取 SKILL.md；如果检查失败，请明确告诉我「版本检查失败，本次使用本地版本」，然后继续任务，不要反复重试。',
          },
          {
            id: 'restricted',
            title: '访问受限技能',
            description: 'NAMESPACE_ONLY 技能仅命名空间成员可访问；PRIVATE 技能仅所有者或明确授权的用户可访问。访问它们需要登录并具备相应权限。',
            steps: [
              '点击右上角「登录」。如果实例接入企业 SSO，请使用企业登录；否则用账号密码注册。',
              '登录后进入「控制台」确认个人信息。若未开放自助注册，请联系平台管理员。',
              '在控制台「访问凭证」卡片点「查看 API Tokens」→「创建 API Token」，命名后创建。Token 以 sk_ 开头，只显示一次，请立即复制保存。',
              'Token 属于凭据，不要写入代码、文档、日志或 Git；离职或权限变更时及时撤销。',
            ],
            code: '# 登录、whoami、logout 可直接执行，但需要真实有效的 SKILLHUB_TOKEN\nnpx @astron-team/skillhub@latest login --token "$SKILLHUB_TOKEN" --registry {{REGISTRY_URL}}\nnpx @astron-team/skillhub@latest whoami --registry {{REGISTRY_URL}}\n\n# 受限技能没有通用示例坐标：先把变量改成详情页显示的真实值并回显确认\nexport SKILL_SLUG=my-skill\nexport SKILL_NAMESPACE=team-name\nprintf \'skill=@%s/%s\\n\' "$SKILL_NAMESPACE" "$SKILL_SLUG"\nnpx @astron-team/skillhub@latest install "$SKILL_SLUG" --namespace "$SKILL_NAMESPACE" --scope user --agent codex --registry {{REGISTRY_URL}}\n\n# 用完后清除本机凭据\nnpx @astron-team/skillhub@latest logout --registry {{REGISTRY_URL}}',
          },
          {
            id: 'troubleshooting',
            title: '常见问题',
            description: '安装和使用技能时的常见问题及解决方法。',
            steps: [
              '**匿名安装返回 401**：先确认失败请求不是 /api/v1/auth/me。PUBLIC 技能的实际安装或下载仍返回 401 时，记录请求方法、路径、状态码和时间交给管理员，不要索要用户 Token。',
              '**权限错误 (403)**：检查是否登录，是否有命名空间的相应权限。PRIVATE 和 NAMESPACE_ONLY 技能需要授权。',
              '**找不到技能**：确认技能名称和命名空间正确。PUBLIC/NAMESPACE_ONLY 通常安装 PUBLISHED 版本；PRIVATE 可安装当前用户有权访问的最新上传版本。',
              '**版本检查失败**：网络问题或服务暂时不可用，Agent 会使用本地版本继续任务并提示失败。',
              '**查看本地已装技能**：用 skillhub list；想从注册中心搜：用 skillhub search 关键词。',
            ],
            code: '# 可接着上面的 skillhub-hello 安装示例执行\nnpx @astron-team/skillhub@latest list --registry {{REGISTRY_URL}}\nnpx @astron-team/skillhub@latest search skillhub-hello --registry {{REGISTRY_URL}}\nnpx @astron-team/skillhub@latest remove skillhub-hello --registry {{REGISTRY_URL}}',
          },
        ],
      },
      publisher: {
        label: '发布者',
        summary: '打包、发布并分享你的技能。',
        sections: [
          {
            id: 'structure',
            title: '技能目录结构',
            description: '根目录中的 SKILL.md 是唯一通用的必需文件，其 YAML frontmatter 必须包含 name 和 description。脚本、依赖清单和资源文件是否需要，取决于技能本身。发布版本由 SkillHub 管理，不要求在 frontmatter 中填写 version。',
            code: 'my-skill/\n├── SKILL.md          # 必需：技能说明和使用指令\n├── scripts/          # 可选：自动化脚本\n├── references/       # 可选：参考资料\n└── assets/           # 可选：模板、图片等资源\n\n# SKILL.md 基本格式\n---\nname: my-skill\ndescription: 简短说明技能做什么，以及何时使用\n---\n\n## 使用方法\n说明 Agent 应如何执行任务。\n\n## 前置要求\n列出所需工具、权限、依赖或配置。\n\n## 限制和注意事项\n说明技能的边界、风险和失败处理方式。',
          },
          {
            id: 'publish',
            title: '登录并发布',
            description: '发布是写操作，必须先创建 API Token。下面的「发布 Prompt」固定发布到 global，且可见性固定为 public；填入技能目录和一次性 Token 后交给 Agent，即授权它连续完成审计、登录、dry-run 和正式发布。普通用户提交后通常进入 PENDING_REVIEW，只有审核通过或服务器返回 PUBLISHED 才算上线。',
            steps: [
              '**获取 API Token**：登录网页后进入「控制台」→「访问凭证」卡片 →「查看 API Tokens」→「创建 API Token」，命名后创建。Token 以 sk_ 开头，创建后只显示一次，请立即复制保存。',
              '可把本次发布专用的一次性 Token 直接交给 Agent，也可用 SKILLHUB_TOKEN 环境变量传入。Agent 不得回显或写入项目文件；任务结束后应 logout，你还需回到网页撤销该 Token。',
              '把技能目录和一次性 Token 填入下面的 Prompt 后交给 Agent。发送这份 Prompt 即表示确认发布到 global，并设置为 public；无需在 dry-run 前后重复确认。',
              'Prompt 中显式传入 --namespace global 和 --visibility public，避免依赖默认值或发错位置。',
            ],
            code: '# 使用前：把目录和一次性 Token 替换为真实值，然后整段交给 Agent\n请把 C:\\path\\to\\my-skill 发布到 {{REGISTRY_URL}}。\n目标命名空间固定为 global，可见性固定为 public。\n本次发布专用的一次性 Token：<在这里粘贴 Token>\n\n发送本 Prompt 即表示我确认并授权你按上述目录、global、public 连续执行 dry-run 和正式发布，无需再次询问确认。请先阅读 {{REGISTRY_URL}}/registry/skill.md，并遵守以下规则：\n1. 审计 SKILL.md 和文件清单。硬编码凭据、未说明的数据外传、越界或不可逆删除、恶意或隐蔽执行属于阻断问题；已说明且符合技能用途的联网、外部命令和限定目录文件操作仅作能力披露，不得仅因此停止。\n2. 发现阻断问题时停止，指出具体文件、原因和修复方法。仅有能力披露时，记录在最终报告中并直接继续。\n3. 使用上面的一次性 Token 登录。不得回显、复述、写入文件或日志，也不得仅因 Token 出现在本次对话中停止。\n4. 从 Prompt 读取 Token 和技能目录，在进程内使用，不要把 Token 写入脚本或配置。依次执行以下 CLI 操作：\n   npx @astron-team/skillhub@latest login --token "<Prompt 中的一次性 Token>" --registry {{REGISTRY_URL}}\n   npx @astron-team/skillhub@latest publish "<Prompt 中的技能目录>" --namespace global --visibility public --registry {{REGISTRY_URL}} --dry-run\n   dry-run 通过后立即执行同一条 publish 命令并移除 --dry-run。命令失败时停止并原样报告错误和修复建议。\n5. 准确报告服务器状态：PENDING_REVIEW 表示等待审核、尚未上线；只有 PUBLISHED 才能称为已上线。若为 PUBLISHED，使用 --scope user --agent codex 验证安装。\n6. 无论完成或中止，都执行 npx @astron-team/skillhub@latest logout --registry {{REGISTRY_URL}} 清除本机凭据。最后明确提醒我：立即到「控制台 → 访问凭证 → API Tokens」删除本次一次性 Token。',
          },
          {
            id: 'review',
            title: '理解审核状态',
            description: 'PUBLIC 和 NAMESPACE_ONLY 版本需要审核；SUPER_ADMIN 可以直发 PUBLISHED。PRIVATE 版本走受限流程，不应当作公开可安装版本。关闭安全扫描只改变扫描前置条件，不会让普通用户绕过审核。',
            steps: [
              'PENDING_REVIEW：PUBLIC/NAMESPACE_ONLY 版本等待审核。公开搜索、匿名安装和 latest 都不会使用该版本。',
              'PUBLISHED：审核通过或管理员直发；PUBLIC/NAMESPACE_ONLY 的 latest 随之更新。PRIVATE 不走审核，其 latest 指向最新上传版本。',
              'REJECTED 或 YANKED：不能作为当前公开版本安装；隐藏和归档也会影响普通用户访问。',
            ],
            image: {
              src: '/guide-assets/review-list.png',
              alt: 'SkillHub 技能审核列表',
              caption: '版本处于 PENDING_REVIEW 时，不要对外宣称「已上线」或「latest 已更新」。',
            },
          },
          {
            id: 'share',
            title: '验证与分享',
            description: '发布后用安装命令验证，再把技能分享给团队。只有 PUBLISHED 状态的技能才适合给出普通用户安装命令。',
            code: '# 复用发布时已经确认的真实值；以下默认值仅为模板，执行前必须修改并回显\nexport SKILL_SLUG=my-skill\nexport SKILL_NAMESPACE=kb-ops\nprintf \'skill=@%s/%s\\n\' "$SKILL_NAMESPACE" "$SKILL_SLUG"\nnpx @astron-team/skillhub@latest install "$SKILL_SLUG" --namespace "$SKILL_NAMESPACE" --scope user --agent codex --registry {{REGISTRY_URL}}\n\n# 分享给 AI 时提供 Registry 说明、完整坐标和具体任务\n请阅读 {{REGISTRY_URL}}/registry/skill.md，安装并使用 @$SKILL_NAMESPACE/$SKILL_SLUG 完成以下任务：[任务描述]',
          },
          {
            id: 'sync',
            title: '进阶：让技能检查更新',
            description: '这是发布者可复制进 SKILL.md 的唯一版本同步模板。使用者轨道只引用这条规则，避免多处内容漂移。skillhub update 只更新 CLI 自身，技能更新仍使用 install --force。',
            code: '## 使用前版本检查\n\n执行任务前，读取注册中心说明并检查本技能是否有可访问的新版本。\n\n1. 明确使用本技能原来的 registry、坐标和安装目标，不得回落到其他默认 registry。\n2. 有新版本时使用 install --force 更新；更新成功后重新读取新版 SKILL.md。\n3. 无法自动重载时，请用户重新开始任务。\n4. 断网、超时、服务不可用或权限不足时，提示「版本检查失败，本次使用本地版本，可能已过期」，随后继续任务。\n5. 不得声称本地版本是最新，不得反复重试。\n\n# 注意：skillhub update 只更新 skillhub CLI 自身，不更新技能。',
          },
        ],
      },
      admin: {
        label: '管理员',
        summary: '管理命名空间、成员与审核。',
        sections: [
          {
            id: 'namespace',
            title: '创建命名空间',
            description: '命名空间用于组织团队、项目或产品的技能，并控制访问和审核。创建后，创建者自动成为 OWNER。',
            steps: [
              '登录后点击右上角头像菜单 →「我的命名空间」。',
              '点击「创建命名空间」，填写显示名称和 Slug；用途描述可选。',
              'Slug 为 2–64 位小写字母、数字或连字符，不能以连字符开头/结尾，不能有连续连字符，也不能使用 global、admin 等保留字。',
              '创建后在成员管理中添加协作者，并分配 OWNER、ADMIN 或 MEMBER 角色。',
            ],
            image: {
              src: '/guide-assets/namespace-create.png',
              alt: '创建团队命名空间对话框',
              caption: '创建者自动成为 OWNER，可继续管理成员、审核和技能发布；技能包仍需从「发布」入口上传。',
            },
          },
          {
            id: 'members',
            title: '成员与角色',
            description: '通过角色控制命名空间内的权限。OWNER 拥有全部权限；ADMIN 可管理成员、发布和审核；MEMBER 可查看和发布。',
            steps: [
              '进入命名空间的「成员管理」，点击「添加成员」。',
              '输入用户邮箱或用户名，分配 OWNER、ADMIN 或 MEMBER 角色。',
              'OWNER 负责团队成员、技能发布审核和版本治理，建议定期复核权限。',
              '离职或岗位变动时，及时移除或降级成员权限。',
            ],
          },
          {
            id: 'review',
            title: '审核与上线',
            description: '审核人决定 PENDING_REVIEW 版本的去留：通过则进入 PUBLISHED，拒绝则进入 REJECTED。审核前请逐项检查安全与权限边界。',
            steps: [
              '检查 SKILL.md 的触发条件、输入输出和权限边界是否清晰。',
              '检查脚本是否包含网络上传、凭据读取、删除或执行外部命令等高风险操作。',
              '检查依赖、资源和许可证是否符合企业要求。',
              '确认发布者拥有目标命名空间的发布权限。',
              '通过：PENDING_REVIEW → PUBLISHED；拒绝：PENDING_REVIEW → REJECTED。',
            ],
            image: {
              src: '/guide-assets/review-list.png',
              alt: 'SkillHub 技能审核列表',
              caption: '审核人员在审核列表检查技能说明、文件、权限边界和安全风险，再决定通过或拒绝。',
            },
          },
          {
            id: 'governance',
            title: '治理动作',
            description: '隐藏、归档和 Yank 是独立的治理动作，都会影响普通用户的查看或安装。它们与审核状态分开管理。',
            steps: [
              '隐藏：技能不再对普通用户可见，但不删除数据。',
              '归档：技能标记为归档，通常不再活跃维护。',
              'Yank：撤回某个版本，使其不能作为当前公开版本安装。',
              '这些动作不会自动删除已发布的文件，必要时再单独处理。',
            ],
          },
          {
            id: 'request-admin',
            title: '申请管理员',
            description: '命名空间管理员负责团队成员、发布和审核；平台管理员负责全局用户、审计和跨命名空间治理。申请时请说明账号、目标范围、用途和有效期。',
            code: '我申请成为 kb-ops 命名空间管理员。\n账号：admin-user@example.com\n用途：负责团队成员、技能发布审核和版本治理。\n有效期：长期，由团队负责人定期复核。',
          },
        ],
      },
    },
  },
  en: {
    eyebrow: 'SkillHub Getting Started',
    title: 'Newcomer Guide',
    summary: 'Find the starting path for your role. Run a public skill anonymously in 3 minutes, then open the user, publisher, or administrator track.',
    cards: [
      ['Use skills', 'Search, install, and run skills through agents.'],
      ['Publish skills', 'Package, publish, and share your skills.'],
      ['Manage teams', 'Manage namespaces, members, and reviews.'],
    ],
    quickstart: {
      id: 'quickstart',
      title: '3-minute quick start (all roles)',
      description: 'No sign-in required. Every PUBLIC skill can be viewed, downloaded, and installed anonymously; @global is only the default namespace used in this example. A coordinate uniquely identifies a skill as @namespace/skill.',
      steps: [
        'Search for the built-in starter skill skillhub-hello and open its detail page. If built-in skills are disabled, select any PUBLIC market skill and replace the coordinate below.',
        'Copy the AI prompt in the install section. It contains the instructions URL, coordinate, and an install request, but no token or other secret.',
        'Paste it to an agent with terminal, network, and skill-directory access. The AI should choose an explicit target, install, read SKILL.md, and report the result.',
        'Do not call an authentication endpoint first for anonymous installs. A 401 from /api/v1/auth/me only means there is no current session.',
      ],
      code: AI_INSTALL_PROMPT_EN,
      image: {
        src: '/guide-assets/homepage.png',
        alt: 'Agent and human quick-start options on the SkillHub home page',
        caption: 'The home page provides Agent, Human, and CLI entry points. The Agent option generates a Registry setup prompt for the current server.',
      },
    },
    roles: {
      user: {
        label: 'User',
        summary: 'Find, install, and use skills through agents.',
        sections: [
          {
            id: 'discover',
            title: 'Discover and search skills',
            description: 'Find the skills you need on SkillHub and learn how they work.',
            steps: [
              'Use the search box to find skills by name, keyword, or namespace.',
              'Open the detail page and read SKILL.md for functionality, usage, and prerequisites.',
              'Check version information and update dates; prioritize actively maintained skills.',
              'PUBLIC skills in every namespace can be viewed, downloaded, and installed anonymously. NAMESPACE_ONLY and PRIVATE skills require sign-in and authorization.',
            ],
            image: {
              src: '/guide-assets/skill-discovery-search.png',
              alt: 'SkillHub skill search page',
              caption: 'Open a skill from home search or popular downloads; verify its version, namespace, and SKILL.md on the detail page.',
            },
          },
          {
            id: 'install',
            title: 'Install a public skill',
            description: 'The detail page defaults to an AI prompt and also provides CLI commands. Every PUBLIC skill requires no sign-in. Beginners should give the prompt to an agent with terminal access; manual commands must specify both the registry and install target.',
            steps: [
              'Copy the AI prompt to the agent. It contains the instructions URL and full coordinate; the agent reads install requirements from the linked protocol. It contains no token.',
              'Coordinate rules: @global/my-skill maps to my-skill; @team-name/my-skill maps to team-name--my-skill. Do not use @global--my-skill.',
              'The CLI installs the latest accessible version by default; pin one with --version, not name@version. PUBLIC/NAMESPACE_ONLY latest follows PUBLISHED; PRIVATE latest points to the newest upload.',
              'For non-interactive execution, specify --scope with --agent, or use --dir. --scope alone can still fail when multiple agents are detected.',
              'Judge installation by the CLI or download request itself. A 401 from /api/v1/auth/me only means there is no current session.',
            ],
            code: '# These skillhub-hello commands are directly executable and target the Codex user directory\nnpx @astron-team/skillhub@latest search skillhub-hello --registry {{REGISTRY_URL}}\nnpx @astron-team/skillhub@latest install skillhub-hello --scope user --agent codex --registry {{REGISTRY_URL}}\n\n# Pin the initial built-in version\nnpx @astron-team/skillhub@latest install skillhub-hello --version 1.0.0 --scope user --agent codex --force --registry {{REGISTRY_URL}}\n\n# You may use --dir /explicit/path instead of --scope and --agent; replace the profile outside Codex',
            image: {
              src: '/guide-assets/skill-detail-star.png',
              alt: 'Install section and file browser on a skill detail page',
              caption: 'The install section appears first on the right, followed by the file browser. Copy an AI prompt or CLI command.',
            },
          },
          {
            id: 'use',
            title: 'Use skills through agents',
            description: 'Agents with the required tools and permissions can install and use skills. Otherwise, they should identify the missing capability and provide manual steps. They must reread SKILL.md after an update.',
            code: 'Please use the team-name--my-skill skill to help me with the following task:\n\n[Describe your specific task]\n\nBefore using it:\n1. State whether you have terminal, network, and skill-directory access\n2. Check SkillHub for an update and install the latest version when available\n3. Reread SKILL.md after updating; ask me to restart the task if you cannot reload it\n4. Follow the skill instructions to execute the task\n5. If installation or update is unavailable, explain why and provide a copyable manual command',
          },
          {
            id: 'update',
            title: 'Keep skills up to date',
            description: 'Users only need to ask the agent to check before execution. The reusable synchronization template lives once in the publisher track. On failure, the agent may continue locally but must report that the check failed.',
            code: 'Before using the skill, follow the registry instructions to check for updates. Reread SKILL.md after a successful update. If the check fails, tell me "version check failed; using the local version" and continue without repeated retries.',
          },
          {
            id: 'restricted',
            title: 'Access restricted skills',
            description: 'NAMESPACE_ONLY skills are accessible only to namespace members; PRIVATE skills only to owners or explicitly authorized users. Accessing them requires sign-in and the appropriate permissions.',
            steps: [
              'Select Login at the top right. Use enterprise SSO when available, or register with username and password.',
              'After signing in, open Dashboard and verify your profile. Contact the platform administrator when self-registration is disabled.',
              'Generate an API token in Dashboard → the "Credentials" card → "View API Tokens" → "Create API Token". The token starts with sk_ and is shown only once, so copy it immediately.',
              'Treat tokens as credentials: never put them in code, docs, logs, or Git; revoke them when roles change or on departure.',
            ],
            code: '# login, whoami, and logout are directly executable with a valid SKILLHUB_TOKEN\nnpx @astron-team/skillhub@latest login --token "$SKILLHUB_TOKEN" --registry {{REGISTRY_URL}}\nnpx @astron-team/skillhub@latest whoami --registry {{REGISTRY_URL}}\n\n# Restricted skills have no universal example coordinate; set real detail-page values and confirm them first\nexport SKILL_SLUG=my-skill\nexport SKILL_NAMESPACE=team-name\nprintf \'skill=@%s/%s\\n\' "$SKILL_NAMESPACE" "$SKILL_SLUG"\nnpx @astron-team/skillhub@latest install "$SKILL_SLUG" --namespace "$SKILL_NAMESPACE" --scope user --agent codex --registry {{REGISTRY_URL}}\n\n# Clear local credentials when finished\nnpx @astron-team/skillhub@latest logout --registry {{REGISTRY_URL}}',
          },
          {
            id: 'troubleshooting',
            title: 'Troubleshooting',
            description: 'Common issues when installing and using skills, and how to resolve them.',
            steps: [
              '**Anonymous install returns 401**: First confirm the failed request is not /api/v1/auth/me. If an actual PUBLIC install or download still returns 401, record the method, path, status, and time for an administrator. Do not request a user token.',
              '**Permission errors (403)**: Verify you are signed in and have the appropriate namespace permissions. PRIVATE and NAMESPACE_ONLY skills require authorization.',
              '**Skill not found**: Confirm both skill name and namespace. PUBLIC/NAMESPACE_ONLY normally install PUBLISHED versions; PRIVATE may install the newest uploaded version accessible to the current user.',
              '**Version check failed**: Network issues or temporary service unavailability. The agent continues with the local version and reports the failure.',
              '**Inspect installed skills**: use skillhub list; to search the registry: use skillhub search <keyword>.',
            ],
            code: '# Run these after the skillhub-hello installation example above\nnpx @astron-team/skillhub@latest list --registry {{REGISTRY_URL}}\nnpx @astron-team/skillhub@latest search skillhub-hello --registry {{REGISTRY_URL}}\nnpx @astron-team/skillhub@latest remove skillhub-hello --registry {{REGISTRY_URL}}',
          },
        ],
      },
      publisher: {
        label: 'Publisher',
        summary: 'Package, publish, and share your skills.',
        sections: [
          {
            id: 'structure',
            title: 'Skill directory structure',
            description: 'SKILL.md at the package root is the only universally required file. Its YAML frontmatter requires name and description. Scripts, dependency manifests, and assets are skill-specific. SkillHub manages publication versions, so version is not required in frontmatter.',
            code: 'my-skill/\n├── SKILL.md          # Required: instructions and documentation\n├── scripts/          # Optional: automation scripts\n├── references/       # Optional: reference material\n└── assets/           # Optional: templates, images, and resources\n\n# Basic SKILL.md format\n---\nname: my-skill\ndescription: What the skill does and when to use it\n---\n\n## Usage\nExplain how the agent should perform the task.\n\n## Prerequisites\nList required tools, permissions, dependencies, or configuration.\n\n## Limitations\nDocument boundaries, risks, and failure handling.',
          },
          {
            id: 'publish',
            title: 'Sign in and publish',
            description: 'Publishing requires an API token. The prompt below is fixed to the global namespace with public visibility. After adding the skill directory and a single-use token, sending it authorizes the agent to audit, sign in, dry-run, and publish without repeated confirmations. A regular-user submission is usually PENDING_REVIEW and is live only after approval or when the server returns PUBLISHED.',
            steps: [
              '**Get an API token**: after signing in on the web, open Dashboard → the "Credentials" card → "View API Tokens" → "Create API Token", name it, and create it. The token starts with sk_ and is shown only once, so copy it immediately.',
              'You may give the agent a single-use token dedicated to this publish, or pass it through SKILLHUB_TOKEN. The agent must not echo it or write it into project files; it should log out when done, and you must then revoke the token in the web UI.',
              'Fill the skill directory and single-use token into the prompt. Sending it confirms global and public and authorizes the complete publish flow without repeated confirmation.',
              'The prompt explicitly passes --namespace global and --visibility public instead of relying on defaults.',
            ],
            code: '# Replace the directory and single-use token, then send this entire prompt to the agent\nPublish C:\\path\\to\\my-skill to {{REGISTRY_URL}}.\nThe namespace is fixed to global and visibility is fixed to public.\nSingle-use token for this publish: <paste token here>\n\nSending this prompt confirms and authorizes the directory, global namespace, public visibility, dry-run, and final publish without another confirmation. Read {{REGISTRY_URL}}/registry/skill.md first, then follow these rules:\n1. Audit SKILL.md and the file list. Hard-coded credentials, undisclosed exfiltration, out-of-scope or irreversible deletion, and malicious or concealed execution are blockers. Documented network access, external commands, and bounded file operations that match the skill purpose are disclosures, not blockers.\n2. Stop only for a blocker and report its file, reason, and remediation. With disclosures only, include them in the final report and continue.\n3. Sign in with the single-use token above. Never echo, quote, log, or write it to a file, and do not stop merely because it appears in this conversation.\n4. Read the token and directory from this prompt and keep the token in process memory rather than writing it to a script or config. Run:\n   npx @astron-team/skillhub@latest login --token "<single-use token from prompt>" --registry {{REGISTRY_URL}}\n   npx @astron-team/skillhub@latest publish "<skill directory from prompt>" --namespace global --visibility public --registry {{REGISTRY_URL}} --dry-run\n   If validation succeeds, immediately run the same publish command without --dry-run. Stop on command failure and report the original error and remediation.\n5. Report status precisely: PENDING_REVIEW is not live; only PUBLISHED is live. If PUBLISHED, verify installation with --scope user --agent codex.\n6. On success or failure, run npx @astron-team/skillhub@latest logout --registry {{REGISTRY_URL}}. Finally remind me to immediately delete this single-use token under Dashboard → Credentials → API Tokens.',
          },
          {
            id: 'review',
            title: 'Understand review states',
            description: 'PUBLIC and NAMESPACE_ONLY versions require review; SUPER_ADMIN can publish directly to PUBLISHED. PRIVATE versions follow a restricted workflow and are not public installable releases. Disabling security scanning changes only the scan prerequisite; it does not bypass review for regular users.',
            steps: [
              'PENDING_REVIEW: a PUBLIC/NAMESPACE_ONLY version awaits review. Public search, anonymous installation, and latest do not use it.',
              'PUBLISHED: approved or directly published by an administrator; PUBLIC/NAMESPACE_ONLY latest follows it. PRIVATE skips review and latest points to the newest upload.',
              'REJECTED or YANKED: the version is not a current public install target. Hiding and archiving also affect user access.',
            ],
            image: {
              src: '/guide-assets/review-list.png',
              alt: 'SkillHub skill review list',
              caption: 'When a version is PENDING_REVIEW, do not claim that it is live or that latest has changed.',
            },
          },
          {
            id: 'share',
            title: 'Verify and share',
            description: 'After publishing, verify with the install command, then share the skill with your team. Provide a public install command only for PUBLISHED skills.',
            code: '# Reuse values confirmed during publishing; these defaults are templates and must be edited and printed first\nexport SKILL_SLUG=my-skill\nexport SKILL_NAMESPACE=kb-ops\nprintf \'skill=@%s/%s\\n\' "$SKILL_NAMESPACE" "$SKILL_SLUG"\nnpx @astron-team/skillhub@latest install "$SKILL_SLUG" --namespace "$SKILL_NAMESPACE" --scope user --agent codex --registry {{REGISTRY_URL}}\n\n# Give an AI the Registry instructions, full coordinate, and concrete task\nRead {{REGISTRY_URL}}/registry/skill.md, install @$SKILL_NAMESPACE/$SKILL_SLUG, and use it for this task: [describe the task]',
          },
          {
            id: 'sync',
            title: 'Advanced: let a skill check for updates',
            description: 'This is the single synchronization template publishers can copy into SKILL.md. The user track only references it. skillhub update updates the CLI itself; use install --force for a skill.',
            code: '## Version check before use\n\nBefore executing a task, read the registry instructions and check for an accessible newer version of this skill.\n\n1. Use the skill\'s original registry, coordinate, and install target; never fall back to another default registry.\n2. When a newer version exists, update with install --force and reread the new SKILL.md.\n3. If automatic reload is unavailable, ask the user to restart the task.\n4. On network, timeout, service, or permission failure, report "version check failed; using the local version, which may be outdated" and continue.\n5. Never claim the local copy is current and do not retry repeatedly.\n\n# Note: skillhub update updates the skillhub CLI itself, not skills.',
          },
        ],
      },
      admin: {
        label: 'Administrator',
        summary: 'Manage namespaces, members, and reviews.',
        sections: [
          {
            id: 'namespace',
            title: 'Create a namespace',
            description: 'Namespaces organize skills for a team, project, or product and control access and reviews. The creator automatically becomes OWNER.',
            steps: [
              'After signing in, open the avatar menu at the top right and select My Namespaces.',
              'Create a namespace and provide its display name and slug; the purpose description is optional.',
              'A slug is 2–64 lowercase letters, digits, or hyphens; it cannot start/end with a hyphen, contain consecutive hyphens, or use reserved values such as global or admin.',
              'Add collaborators and assign OWNER, ADMIN, or MEMBER roles.',
            ],
            image: {
              src: '/guide-assets/namespace-create.png',
              alt: 'Create team namespace dialog',
              caption: 'The creator becomes OWNER and can manage members, reviews, and publishing. Upload skill packages from the Publish entry.',
            },
          },
          {
            id: 'members',
            title: 'Members and roles',
            description: 'Roles control permissions within a namespace. OWNER has all permissions; ADMIN can manage members, publishing, and reviews; MEMBER can view and publish.',
            steps: [
              'Open Members in the namespace and select Add member.',
              'Enter the user email or username and assign OWNER, ADMIN, or MEMBER.',
              'OWNER handles team members, publishing reviews, and version governance; review permissions regularly.',
              'Remove or downgrade members promptly on departure or role change.',
            ],
          },
          {
            id: 'review',
            title: 'Review and publish',
            description: 'Reviewers decide the fate of PENDING_REVIEW versions: approve to PUBLISHED or reject to REJECTED. Check security and permission boundaries before deciding.',
            steps: [
              'Check that SKILL.md clearly describes trigger conditions, inputs, outputs, and permission boundaries.',
              'Check scripts for high-risk operations such as network uploads, credential reads, deletes, or external command execution.',
              'Check dependencies, resources, and licenses against enterprise requirements.',
              'Confirm the publisher has publish permission on the target namespace.',
              'Approve: PENDING_REVIEW → PUBLISHED; reject: PENDING_REVIEW → REJECTED.',
            ],
            image: {
              src: '/guide-assets/review-list.png',
              alt: 'SkillHub skill review list',
              caption: 'Reviewers inspect instructions, files, permission boundaries, and security risks before approving or rejecting.',
            },
          },
          {
            id: 'governance',
            title: 'Governance actions',
            description: 'Hide, archive, and yank are independent governance actions that affect what regular users can view or install. They are managed separately from review states.',
            steps: [
              'Hide: the skill is no longer visible to regular users, but data is not deleted.',
              'Archive: the skill is marked as archived and typically no longer actively maintained.',
              'Yank: a version is withdrawn and can no longer be installed as the current public version.',
              'These actions do not delete published files automatically; handle that separately if needed.',
            ],
          },
          {
            id: 'request-admin',
            title: 'Request administrator access',
            description: 'Namespace administrators manage team membership, publishing, and reviews. Platform administrators manage global users, auditing, and cross-namespace governance. Include the account, scope, purpose, and duration in your request.',
            code: 'Please grant administrator access to the kb-ops namespace.\nAccount: admin-user@example.com\nPurpose: manage members, publishing reviews, and version governance.\nDuration: ongoing, reviewed regularly by the team owner.',
          },
        ],
      },
    },
  },
} satisfies Record<'zh' | 'en', GuideCopy>

function getRegistryUrl() {
  if (typeof window === 'undefined') return 'https://skillhub.example.com'
  return resolvePublicRegistryUrl(window.__SKILLHUB_RUNTIME_CONFIG__?.appBaseUrl, window.location.origin)
}

function resolveGuideText(value: string, registryUrl: string) {
  return value.split(REGISTRY_URL_PLACEHOLDER).join(registryUrl)
}

function getInitialRole(): Role {
  if (typeof window === 'undefined') return 'user'
  const hash = window.location.hash.replace(/^#/, '')
  return (ROLE_ORDER as readonly string[]).includes(hash) ? (hash as Role) : 'user'
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

function GuideSectionView({ section, registryUrl, idPrefix }: { section: GuideSection; registryUrl: string; idPrefix?: string }) {
  return (
    <section id={idPrefix ? `${idPrefix}-${section.id}` : section.id} className="scroll-mt-24">
      <h3 className="text-xl font-bold tracking-normal text-foreground">{section.title}</h3>
      {section.description ? <p className="mt-3 leading-7 text-muted-foreground">{section.description}</p> : null}
      {section.steps ? (
        <ol className="mt-5 space-y-4">
          {section.steps.map((step, index) => <li key={step} className="flex gap-3 leading-7 text-foreground"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span><span><StepText>{step}</StepText></span></li>)}
        </ol>
      ) : null}
      {section.code ? <CodeBlock>{resolveGuideText(section.code, registryUrl)}</CodeBlock> : null}
      {section.image ? (
        <figure className="mt-6 overflow-hidden rounded-md border bg-slate-50">
          <img
            src={withBasePath(section.image.src)}
            alt={section.image.alt}
            loading="lazy"
            className="block h-auto w-full"
          />
          <figcaption className="border-t px-4 py-3 text-sm leading-6 text-muted-foreground">
            {section.image.caption}
          </figcaption>
        </figure>
      ) : null}
    </section>
  )
}

interface TocItem {
  id: string
  title: string
}

// Highlights the section currently in view so the left-hand nav tracks the page.
function useScrollSpy(ids: string[]) {
  const [activeId, setActiveId] = useState(ids[0] ?? '')
  useEffect(() => {
    setActiveId(ids[0] ?? '')
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveId((visible[0].target as HTMLElement).id)
      },
      { rootMargin: '-96px 0px -65% 0px' },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
    // ids is recomputed per render; join gives a stable effect key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')])
  return activeId
}

function TableOfContents({
  role,
  roles,
  quickstart,
  activeId,
  label,
  onRoleChange,
}: {
  role: Role
  roles: Record<Role, RoleGuide>
  quickstart: GuideSection
  activeId: string
  label: string
  onRoleChange: (next: Role) => void
}) {
  const scrollTo = (id: string) => (event: MouseEvent) => {
    // Smooth-scroll without touching location.hash, so the role tab
    // (encoded in the hash) survives navigation/refresh.
    event.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav aria-label={label}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <ul className="space-y-1 text-sm">
        <li>
          <a
            href="#quickstart"
            onClick={scrollTo('quickstart')}
            className={cn(
              'block rounded-md px-3 py-1.5 leading-6 transition-colors',
              activeId === 'quickstart'
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {quickstart.title}
          </a>
        </li>
        {ROLE_ORDER.map((r) => (
          <li key={r}>
            <button
              type="button"
              onClick={() => onRoleChange(r)}
              className={cn(
                'flex w-full items-center rounded-md px-3 py-1.5 text-left leading-6 transition-colors',
                r === role
                  ? 'bg-primary/10 font-semibold text-primary'
                  : 'font-medium text-foreground hover:bg-muted',
              )}
            >
              {roles[r].label}
            </button>
            {r === role ? (
              <ul className="ml-3 mt-1 space-y-0.5 border-l border-border">
                {roles[r].sections.map((section) => {
                  const sid = `${r}-${section.id}`
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${sid}`}
                        onClick={scrollTo(sid)}
                        className={cn(
                          '-ml-px block border-l-2 py-1.5 pl-3 leading-6 transition-colors',
                          activeId === sid
                            ? 'border-primary font-medium text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {section.title}
                      </a>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function GuidePage() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.split('-')[0] === 'zh' ? 'zh' : 'en'
  const copy = guideCopy[language]
  const registryUrl = getRegistryUrl()
  const [role, setRole] = useState<Role>(getInitialRole)

  const handleRoleChange = (next: string) => {
    const nextRole = next as Role
    setRole(nextRole)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${next}`)
    }
    // After switching roles, land on the new role's first section. Both the
    // left-hand role nav and the mobile tabs route through this handler.
    const first = copy.roles[nextRole].sections[0]
    if (first && typeof document !== 'undefined' && typeof requestAnimationFrame !== 'undefined') {
      const targetId = `${nextRole}-${first.id}`
      requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  const tocItems = useMemo<TocItem[]>(() => {
    const items: TocItem[] = [{ id: 'quickstart', title: copy.quickstart.title }]
    for (const section of copy.roles[role].sections) {
      items.push({ id: `${role}-${section.id}`, title: section.title })
    }
    return items
  }, [copy, role])

  const activeId = useScrollSpy(tocItems.map((item) => item.id))
  const tocLabel = language === 'zh' ? '本页目录' : 'On this page'
  const roleChoiceLabel = language === 'zh' ? '选择你的使用路径' : 'Choose your path'

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-12">
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <TableOfContents
              role={role}
              roles={copy.roles}
              quickstart={copy.quickstart}
              activeId={activeId}
              label={tocLabel}
              onRoleChange={handleRoleChange}
            />
          </div>
        </aside>
        <article className="min-w-0 rounded-md border bg-white px-5 py-8 shadow-sm sm:px-8 lg:px-12 lg:py-10">
          <div className="mb-8 border-b pb-8">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary"><BookOpen className="h-4 w-4" />{copy.eyebrow}</div>
            <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">{copy.title}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{copy.summary}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-label={roleChoiceLabel}>
              {copy.cards.map(([title, description], index) => {
                const cardRole = ROLE_ORDER[index]
                return (
                  <button
                    type="button"
                    key={title}
                    onClick={() => handleRoleChange(cardRole)}
                    aria-pressed={role === cardRole}
                    className={cn(
                      'rounded-md border p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      role === cardRole && 'border-primary/50 bg-primary/5',
                    )}
                  >
                    <div className="font-semibold text-foreground">{title}</div>
                    <div className="mt-1 text-sm leading-5 text-muted-foreground">{description}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <GuideSectionView section={copy.quickstart} registryUrl={registryUrl} />

          <div className="mt-12">
            <div className="lg:hidden">
              <Tabs value={role} onValueChange={handleRoleChange}>
                <TabsList className="w-full">
                  {ROLE_ORDER.map((r) => <TabsTrigger key={r} value={r}>{copy.roles[r].label}</TabsTrigger>)}
                </TabsList>
              </Tabs>
            </div>

            <div className="mt-8">
              {ROLE_ORDER.map((r) => (
                <div key={r} className={r === role ? 'space-y-10' : 'hidden'} aria-hidden={r !== role}>
                  <p className="text-sm font-medium text-muted-foreground">{copy.roles[r].summary}</p>
                  {copy.roles[r].sections.map((section) => <GuideSectionView key={section.id} section={section} registryUrl={registryUrl} idPrefix={r} />)}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 border-t pt-6 text-sm text-muted-foreground">
            <Link to="/skills" className="font-medium text-primary hover:underline">{language === 'zh' ? '前往技能市场 →' : 'Go to skill marketplace →'}</Link>
          </div>
        </article>
      </div>
    </div>
  )
}
