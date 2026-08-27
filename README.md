# Rechang Miniapp — 热场票务平台 C端小程序

uni-app + Vue 3 + TypeScript + Vite，主端微信小程序，预留多端扩展。

## 开发

```bash
npm install

# 微信小程序（产物在 dist/dev/mp-weixin，用微信开发者工具打开）
npm run dev:mp-weixin

# H5（Vite 代理到 localhost:8080 后端）
npm run dev:h5

# 类型检查 / 生产构建
npm run type-check
npm run build:h5
```

接口地址集中配置在 `src/config/env.ts`；后端启动方式见 `../rechang-backend/README.md`。
