import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Check, Copy } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useCopyToClipboard } from '@/shared/lib/clipboard'
import { resolvePublicRegistryUrl } from '@/shared/lib/registry-url'

interface InstallCommandProps {
  namespace: string
  slug: string
  version?: string
}

export function buildInstallTarget(namespace: string, slug: string): string {
  return namespace === 'global' ? slug : `${namespace}--${slug}`
}

export function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  const runtimeConfig = window.__SKILLHUB_RUNTIME_CONFIG__
  return resolvePublicRegistryUrl(
    runtimeConfig?.appBaseUrl,
    `${window.location.protocol}//${window.location.host}`,
  )
}

export function buildInstallCommand(namespace: string, slug: string, baseUrl: string): string {
  const installTarget = buildInstallTarget(namespace, slug)
  return `npx clawhub install ${installTarget} --registry ${baseUrl}`
}

export function buildSkillhubInstallCommand(namespace: string, slug: string, baseUrl: string): string {
  const namespaceArg = namespace === 'global' ? '' : ` --namespace ${namespace}`
  return `npx @astron-team/skillhub@latest install ${slug}${namespaceArg} --registry ${baseUrl}`
}

export function buildAgentInstallPrompt(
  namespace: string,
  slug: string,
  baseUrl: string,
  language: string,
): string {
  const coordinate = `@${namespace}/${slug}`
  const instructionsUrl = `${baseUrl}/registry/skill.md`

  if (language.toLowerCase().startsWith('zh')) {
    return `请阅读 ${instructionsUrl}，并按说明安装技能 ${coordinate}。`
  }

  return `Read ${instructionsUrl} and follow its instructions to install skill ${coordinate}.`
}

interface CommandBlockProps {
  command: string
}

const installMethodTabTriggerClass =
  "relative border-b-0 px-1 py-2 text-xs after:absolute after:bottom-[-1px] after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-transparent after:content-[''] data-[state=active]:after:bg-primary"

function CommandBlock({ command }: CommandBlockProps) {
  const { t } = useTranslation()
  const [copied, copy] = useCopyToClipboard()

  const handleCopy = async () => {
    try {
      await copy(command)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/50">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        title={copied ? t('copyButton.copied') : t('copyButton.copy')}
        aria-label={copied ? t('copyButton.copied') : t('copyButton.copy')}
        className="absolute right-2 top-2 z-10 h-8 w-8 rounded-md bg-background/80 backdrop-blur hover:bg-background"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="px-4 py-3 pr-14 whitespace-pre-wrap break-all">
        <code className="font-mono text-[13px] leading-relaxed text-foreground whitespace-pre-wrap break-all sm:text-sm">
          {command}
        </code>
      </pre>
    </div>
  )
}

export function InstallCommand({ namespace, slug }: InstallCommandProps) {
  const { t, i18n } = useTranslation()
  const baseUrl = useMemo(() => getBaseUrl(), [])
  const agentPrompt = useMemo(
    () => buildAgentInstallPrompt(namespace, slug, baseUrl, i18n.resolvedLanguage ?? i18n.language),
    [baseUrl, i18n.language, i18n.resolvedLanguage, namespace, slug],
  )
  const clawhubCommand = useMemo(() => buildInstallCommand(namespace, slug, baseUrl), [baseUrl, namespace, slug])
  const skillhubCommand = useMemo(() => buildSkillhubInstallCommand(namespace, slug, baseUrl), [baseUrl, namespace, slug])
  const [promptCopied, copyPrompt] = useCopyToClipboard()

  const handleCopyPrompt = async () => {
    try {
      await copyPrompt(agentPrompt)
    } catch (err) {
      console.error('Failed to copy install prompt:', err)
    }
  }

  return (
    <Tabs defaultValue="agent" className="space-y-3">
      <TabsList className="w-full gap-6 border-border/70 bg-transparent p-0 text-xs">
        <TabsTrigger value="agent" className={installMethodTabTriggerClass}>
          {t('skillDetail.installMethodAgent')}
        </TabsTrigger>
        <TabsTrigger value="clawhub" className={installMethodTabTriggerClass}>
          {t('skillDetail.installMethodClawhub')}
        </TabsTrigger>
        <TabsTrigger value="skillhub" className={installMethodTabTriggerClass}>
          {t('skillDetail.installMethodSkillhub')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="agent">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-3 overflow-hidden rounded-lg border border-border/60 bg-muted/40 p-3">
            <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="min-w-0 [overflow-wrap:anywhere] text-sm leading-relaxed text-muted-foreground">
              {agentPrompt}
            </p>
          </div>
          <Button
            type="button"
            className="w-full gap-2 bg-sky-500 text-white shadow-sm hover:bg-sky-600 hover:opacity-100"
            onClick={handleCopyPrompt}
          >
            {promptCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {promptCopied ? t('skillDetail.installPromptCopied') : t('skillDetail.copyInstallPrompt')}
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="clawhub">
        <CommandBlock command={clawhubCommand} />
      </TabsContent>
      <TabsContent value="skillhub">
        <CommandBlock command={skillhubCommand} />
      </TabsContent>
    </Tabs>
  )
}
