# 项目文件结构说明

## 📁 目录结构

```
WebBase_Project_Gantt/
├── src/                          # 源代码目录
│   ├── components/               # React 组件
│   │   ├── FilterPanel.tsx      # 过滤面板组件
│   │   ├── GanttChart.tsx       # 甘特图主组件
│   │   ├── MemberManager.tsx    # 成员管理组件
│   │   ├── SettingsModal.tsx    # 设置模态框组件
│   │   ├── TaskList.tsx         # 任务列表组件
│   │   └── TaskModal.tsx        # 任务编辑模态框组件
│   ├── App.tsx                  # 应用主组件
│   ├── index.tsx                # 应用入口文件
│   ├── types.ts                 # TypeScript 类型定义
│   ├── utils.ts                 # 工具函数
│   └── utils.test.ts            # 工具函数单元测试
│
├── public/                       # 公共资源目录
│   └── assets/                  # 静态资源
│       └── icon.ico             # 应用图标 (ICO 格式，用于打包)
│
├── docs/                         # 项目文档
│   ├── reports/                 # 报告文档
│   │   ├── BUILD_REPORT_v1.0.0-gamma.md      # 构建报告
│   │   ├── granularity_fix_report.md         # 粒度修复报告
│   │   └── validation_report.md              # 验证报告
│   ├── bugfix-logs/             # Bug 修复日志
│   │   └── Save Project Error Handling Enhancement_walkthrough.md
│   ├── ProGanttICON.png         # 应用图标 (PNG 格式，仅用于文档展示)
│   ├── API.md                   # API 文档
│   ├── ARCHITECTURE.md          # 架构文档
│   ├── CHANGELOG.md             # 变更日志
│   ├── DESIGN.md                # 设计文档
│   ├── FEATURES.md              # 功能说明
│   └── PACKAGING_GUIDELINE.md   # 打包指南
│
├── electron/                     # Electron 配置
│   ├── main.cjs                 # Electron 主进程
│   └── preload.cjs              # 预加载脚本
│
├── dist/                         # 构建输出目录 (自动生成)
├── release/                      # 发布包目录 (自动生成)
├── node_modules/                 # 依赖包 (自动生成)
│
├── .agent/                       # AI 助手配置
│   ├── rules/                   # 规则配置
│   └── workflows/               # 工作流配置
│
├── .git/                         # Git 版本控制
├── .gitignore                    # Git 忽略配置
│
├── index.html                    # HTML 入口文件
├── package.json                  # 项目配置和依赖
├── package-lock.json             # 依赖锁定文件
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 构建配置
├── metadata.json                 # 项目元数据
└── README.md                     # 项目说明文档
```

## 📝 重构说明

### 重构日期
2025-11-27

### 重构目标
将项目文件结构从非标准布局重构为符合现代前端项目最佳实践的标准结构。

### 主要变更

#### 1. 源代码组织
- ✅ **创建 `src/` 目录**：所有源代码文件移至 `src/` 目录
- ✅ **组件整理**：`components/` 目录移至 `src/components/`
- ✅ **核心文件迁移**：`App.tsx`, `index.tsx`, `types.ts`, `utils.ts` 移至 `src/`

#### 2. 文档组织
- ✅ **报告文件归档**：创建 `docs/reports/` 目录，存放所有报告文件
  - `BUILD_REPORT_v1.0.0-gamma.md`
  - `granularity_fix_report.md`
  - `validation_report.md`
- ✅ **文档集中管理**：将散落在根目录的文档移至 `docs/`
  - `PACKAGING_GUIDELINE.md`
  - `changelog.md` → `CHANGELOG.md` (重命名)
- ✅ **目录规范化**：`Bugfix_Log/` → `bugfix-logs/` (重命名)

#### 3. 资源文件整理
- ✅ **创建资源目录**：`public/assets/` 用于存放静态资源
- ✅ **图标文件迁移**：
  - `docs/ProGanttICON.png` → `public/assets/ProGanttICON.png`
  - `docs/icon.ico` → `public/assets/icon.ico`

#### 4. 配置文件更新
- ✅ **index.html**：更新脚本引用路径 `/index.tsx` → `/src/index.tsx`
- ✅ **vite.config.ts**：更新路径别名 `@` 指向 `./src`
- ✅ **tsconfig.json**：更新路径映射 `@/*` 指向 `./src/*`
- ✅ **electron/main.cjs**：更新图标路径指向 `public/assets/`

### 优势

1. **符合标准**：遵循现代前端项目的标准目录结构
2. **清晰分离**：源代码、文档、资源、配置文件各司其职
3. **易于维护**：文件组织更加合理，便于查找和维护
4. **扩展性强**：为未来添加新功能提供了良好的基础结构
5. **专业规范**：提升项目的专业性和可读性

### 构建验证
✅ 重构后项目构建成功，所有功能正常运行

### 注意事项
- 所有导入路径已自动更新，无需手动修改
- Git 历史记录保持完整
- 旧的文件路径引用已全部更新
