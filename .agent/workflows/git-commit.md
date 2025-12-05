---
description: git commit before action
---

before git commit any files, please check
- review .docs\ and .docs\guides related files, if there are updating content needed
- review README.md, if there is updating
- ask user about tags and software version number

git commit description rules:
# message formart:
<type>(<scope>): <subject>
[空行]
<body>
[空行]
<footer>
# 说明：
type：提交类型（如 feat/fix）。
scope：影响范围（可选，如 login、api）。
subject：简短描述，命令式语气，不超过 50 字符。
body：详细说明修改原因和内容。
footer：关联 issue 或破坏性变更说明

# type总类:
feat	新功能	feat: 增加用户注册功能
fix	修复 Bug	fix: 修复登录页面崩溃的问题
docs	文档更新	docs: 更新 README 文件
style	代码格式调整（不影响逻辑）	style: 删除多余空行
refactor	重构代码（非新增功能或修复 Bug）	refactor: 重构用户验证逻辑
perf	性能优化	perf: 优化图片加载速度
test	添加或修改测试	test: 增加用户模块单元测试
chore	杂项（构建、工具、依赖）	chore: 更新依赖库
build	构建系统或外部依赖变更	build: 升级 webpack 到 v5
ci	CI/CD 配置修改	ci: 修改 GitHub Actions 配置