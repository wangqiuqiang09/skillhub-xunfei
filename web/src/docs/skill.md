---
name: skillhub-registry
description: 当你需要通过 SkillHub 注册中心搜索、查看、安装或发布 Agent 技能时使用。SkillHub 提供 ClawHub 兼容 API，注册中心操作应优先使用 clawhub CLI，而不是直接调用 HTTP 接口。
---

# SkillHub 技能注册中心

注册中心操作应优先使用 `clawhub` CLI。SkillHub 提供 ClawHub 兼容 API 和 `/.well-known/clawhub.json` 发现端点。

## 配置 CLI

```bash
export CLAWHUB_REGISTRY=${SKILLHUB_PUBLIC_BASE_URL}
npx clawhub install my-skill --registry ${SKILLHUB_PUBLIC_BASE_URL}
```

如需访问受保护资源：

```bash
clawhub login --token sk_your_api_token_here
```

## 坐标规则

| SkillHub 坐标 | ClawHub 标准 Slug |
|---|---|
| `@global/my-skill` | `my-skill` |
| `@team-name/my-skill` | `team-name--my-skill` |

- `--` 是 ClawHub 兼容层的命名空间分隔符。
- 不包含 `--` 时，技能默认属于 `@global`。
- `latest` 始终表示最新的已发布版本。

## 常用操作

```bash
npx clawhub search email
npx clawhub info team-name--my-skill
npx clawhub install team-name--my-skill@latest
npx clawhub publish ./my-skill
```

## 权限与可见性

- `@global` + `PUBLIC`：允许匿名搜索、查看和下载。
- 团队命名空间 + `PUBLIC`：下载需要登录。
- `NAMESPACE_ONLY`：仅命名空间成员可访问。
- `PRIVATE`：仅所有者或明确授权的用户可访问。
- 发布和其他写操作始终需要登录并具备对应权限。

技能包必须使用 `SKILL.md` 作为入口。发布前请排除密钥、Token、临时文件和个人隐私数据。
