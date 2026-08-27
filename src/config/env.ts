/**
 * 环境相关地址集中配置（uni-app 条件编译分流）。
 * - H5：走 Vite dev server 代理，无需后端地址；WS 复用页面域名
 * - 小程序：直连后端；真机联调时改为开发机局域网 IP，上线前替换为正式域名
 * 注：条件编译块对 vue-tsc 不可见，故用 let 单声明 + 分支覆盖的写法保证类型检查通过。
 * 各环境配置说明见工作区仓库 docs/design/environment_config.md
 */
let BASE_URL = ''
let WS_BASE = ''

// #ifdef H5
WS_BASE = `ws://${window.location.host}`
// #endif

// #ifndef H5
BASE_URL = 'http://localhost:8080'
WS_BASE = 'ws://localhost:8080'
// #endif

export { BASE_URL, WS_BASE }
