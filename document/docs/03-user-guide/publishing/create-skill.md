---
title: 创建技能包
sidebar_position: 1
description: 学习如何创建符合规范的技能包
---

# 创建技能包

## 技能包结构

一个标准的 SkillHub 技能包结构如下：

```
my-skill/
├── SKILL.md              # 主入口文件（必需）
├── references/           # 参考资料（可选）
├── scripts/              # 脚本（可选）
└── assets/               # 静态资源（可选）
```

## SKILL.md 格式

SKILL.md 是技能包的主入口文件，使用 YAML frontmatter + Markdown 正文格式：

```markdown
---
name: my-skill
description: 一句话描述这个技能的用途
x-astron-category: code-review
---

# 技能说明

这里是技能的详细说明...
```

### Frontmatter 字段

| 字段 | 必需 | 说明 |
|------|------|------|
| `name` | 是 | 技能标识，kebab-case 格式 |
| `description` | 是 | 技能简短描述 |
| `x-astron-category` | 否 | 分类标签 |
| `x-astron-runtime` | 否 | 运行时要求 |
| `x-astron-min-version` | 否 | 最低版本要求 |

## 文件限制

- 单文件大小：最大 10 MB
- 总包大小：最大 100 MB
- 文件数量：最多 500 个
- 必须包含根目录 `SKILL.md`
- 允许的扩展名：`.md`, `.txt`, `.json`, `.yaml`, `.yml`, `.html`, `.css`, `.csv`, `.pdf`, `.toml`, `.xml`, `.xsd`, `.xsl`, `.dtd`, `.ini`, `.cfg`, `.env`, `.js`, `.cjs`, `.mjs`, `.ts`, `.py`, `.sh`, `.rb`, `.go`, `.rs`, `.java`, `.kt`, `.lua`, `.sql`, `.r`, `.bat`, `.ps1`, `.zsh`, `.bash`, `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`, `.ico`, `.doc`, `.xls`, `.ppt`, `.docx`, `.xlsx`, `.pptx`
- 默认启用扩展名白名单；白名单外的文件会产生发布警告并需要确认
- 管理员设置 `SKILLHUB_PUBLISH_EXTENSION_ALLOWLIST_ENABLED=false` 并重启后，可上传任意扩展名和无扩展名文件
- 路径必须是相对路径，不能包含 `../`、绝对路径或重复条目；图片和 PDF 会校验文件签名，文本文件必须是有效 UTF-8

## 下一步

- [发布流程](./publish) - 发布技能包
