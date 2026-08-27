// #ifdef H5
const WS_BASE = `ws://${window.location.host}`
// #endif
// #ifndef H5
const WS_BASE = 'ws://localhost:8080'
// #endif

export class CountdownWS {
  private socket: UniApp.SocketTask | null = null
  private onMessage: (data: any) => void
  private performanceId: number

  constructor(performanceId: number, onMessage: (data: any) => void) {
    this.performanceId = performanceId
    this.onMessage = onMessage
  }

  connect() {
    this.socket = uni.connectSocket({
      url: `${WS_BASE}/ws/countdown/${this.performanceId}`,
      success: () => {}
    })
    this.socket.onOpen(() => console.log('[WS] connected'))
    this.socket.onMessage((res) => {
      try { this.onMessage(JSON.parse(res.data as string)) } catch (e) { console.error('[WS] parse error', e) }
    })
    this.socket.onClose(() => console.log('[WS] closed'))
    this.socket.onError((err) => console.error('[WS] error', err))
  }

  sendPing() {
    if (this.socket) this.socket.send({ data: JSON.stringify({ type: 'ping' }) })
  }

  close() {
    if (this.socket) { this.socket.close({}); this.socket = null }
  }
}
