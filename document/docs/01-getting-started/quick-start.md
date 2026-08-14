---
title: 快速开始
sidebar_position: 2
description: 一键启动 SkillHub 开发环境
---

# 快速开始

## 一键启动

使用以下命令一键启动完整的 SkillHub 环境：

```bash
curl -fsSL https://raw.githubusercontent.com/iflytek/skillhub/main/scripts/runtime.sh | sh -s -- up
```

或者克隆仓库后手动启动：

```bash
git clone https://github.com/iflytek/skillhub.git
cd skillhub
make dev-all
```

## 默认账号

两种启动方式都会默认创建一个 bootstrap 管理员账号：

- 用户名：`admin`
- 密码：`ChangeMe!2026`

### `curl` 一键部署

| 服务 | 地址 |
|------|------|
| Web UI | http://localhost |
| Backend API | http://localhost:8080 |

使用上述默认账号密码登录即可。**生产环境请务必修改密码。**

### `make dev-all` 本地开发

| 服务 | 地址 |
|------|------|
| Web UI | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |

除了上述 bootstrap 管理员，本地开发还预置两个模拟用户（无需密码）：

| 用户 | 角色 | 说明 |
|------|------|------|
| `local-user` | 普通用户 | 可发布技能、管理命名空间 |
| `local-admin` | 超级管理员 | 拥有所有权限，包括审核和用户管理 |

使用 `X-Mock-User-Id` 请求头切换模拟用户。
如需关闭 bootstrap 管理员，启动前设置 `BOOTSTRAP_ADMIN_ENABLED=false`。

## 常用命令

```bash
# 启动完整开发环境
make dev-all

# 停止所有服务
make dev-all-down

# 重置并重新启动
make dev-all-reset

# 仅启动后端
make dev

# 仅启动前端
make dev-web

# 查看所有可用命令
make help
```

## 注册账号

公开技能可以匿名查看、下载和安装；以下情况需要账号：访问 `NAMESPACE_ONLY` 或 `PRIVATE` 技能、发布技能、创建 API Token，以及调用需要认证的 API。

1. 打开 Web UI，点击右上角「登录」，在登录页选择「注册」。也可以直接访问 `/register`。
2. 填写用户名、邮箱和密码。默认仅支持 `@x-sense.com` 邮箱，管理员可通过部署环境变量调整；用户名为 3–64 位字母、数字或下划线，密码为 6–128 位。
3. 提交后进入「控制台」。如果实例关闭了自助注册，请联系平台管理员或使用企业 SSO。

## 生成 API Token

1. 登录后进入「控制台」，在「访问凭证」卡片中点击「查看 API Tokens」。
2. 点击「创建 API Token」，填写用途名称（最多 64 个字符）。
3. 选择过期时间：永不过期、7 天、30 天、90 天或自定义时间，然后点击创建。
4. Token 以 `sk_` 开头，只在创建成功后显示一次。立即复制并保存，不要写入代码、文档、日志、Git 或技能包。
5. 完成 CLI 操作后执行 `logout`；Token 不再使用时，在 API Tokens 列表中撤销/删除。

```bash
export SKILLHUB_TOKEN="sk_..."
npx @astron-team/skillhub@latest login --token "$SKILLHUB_TOKEN" --registry http://localhost:8080
npx @astron-team/skillhub@latest whoami --registry http://localhost:8080
npx @astron-team/skillhub@latest logout --registry http://localhost:8080
```

## 上传文件限制

技能包必须在根目录包含 `SKILL.md`。默认部署启用扩展名白名单；管理员可关闭扩展名限制。路径、大小、数量和已知格式的内容签名校验始终保留。

| 类别 | 允许的扩展名 |
|------|--------------|
| 文档 | `.md`, `.txt`, `.json`, `.yaml`, `.yml`, `.html`, `.css`, `.csv`, `.pdf` |
| 配置 | `.toml`, `.xml`, `.xsd`, `.xsl`, `.dtd`, `.ini`, `.cfg`, `.env` |
| 代码与脚本 | `.js`, `.cjs`, `.mjs`, `.ts`, `.py`, `.sh`, `.rb`, `.go`, `.rs`, `.java`, `.kt`, `.lua`, `.sql`, `.r`, `.bat`, `.ps1`, `.zsh`, `.bash` |
| 图片 | `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`, `.ico` |
| Office 文档 | `.doc`, `.xls`, `.ppt`, `.docx`, `.xlsx`, `.pptx` |

默认配置下，白名单外的扩展名，例如 `.exe`、`.dll`、`.so`、`.bin`、`.zip`、`.rar`、`.7z`，会产生发布警告并需要确认。管理员设置 `SKILLHUB_PUBLISH_EXTENSION_ALLOWLIST_ENABLED=false` 并重启服务后，任意扩展名和无扩展名文件均可上传。

无论开关如何，单文件最大 10 MB，总包最大 100 MB，最多 500 个文件。路径必须是相对路径，不能包含 `../`、绝对路径或重复条目；PNG/JPEG/GIF/WebP/ICO/PDF/SVG 仍会校验文件签名，白名单内的文本格式仍必须是有效 UTF-8。

发布前建议检查：

```bash
export SKILLHUB_PUBLISH_EXTENSION_ALLOWLIST_ENABLED=false
test -f ./my-skill/SKILL.md
```

## 下一步

- [产品概述](./overview) - 深入了解产品特性
- [典型应用场景](./use-cases) - 探索企业应用场景
- [单机部署](../administration/deployment/single-machine) - 生产环境部署指南
