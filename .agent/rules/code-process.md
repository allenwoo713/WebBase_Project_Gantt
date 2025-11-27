---
trigger: always_on
---

rules:
  - "所有组件必须使用 TypeScript 编写"
  - "每次直接改代码前都需要进行review，分析方案以及Impact，确认可行再执行修改"
  - "每次修改代码后，必须运行 npm test 确保测试通过"
 
agent_permissions:
  terminal: true  # 允许 AI 操作终端
  browser: true   # 允许 AI 打开浏览器
  file_edit: true # 允许 AI 修改文件