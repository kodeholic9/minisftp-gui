// miniSFTP GUI - SFTP Store
// author: kodeholic (powered by Claude)

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

export interface FileEntry {
  name: string
  size: number
  is_dir: boolean
  permission: string
  mtime: string
}

export interface ProgressInfo {
  transferred: number
  total: number
  ratio: number
  speed: number
}

export const useSftpStore = defineStore('sftp', () => {
  const connected             = ref(false)
  const connState             = ref('DISCONNECTED')
  const connectedSessionName  = ref('')
  const connectedSessionLabel = ref('')
  const homeDir               = ref('/')  // 연결 직후 받은 홈 경로
  const transferCancelled     = ref(false)
  const remotePath          = ref('.')
  const remoteFiles         = ref<FileEntry[]>([])
  const progress            = ref<ProgressInfo | null>(null)
  const logs                = ref<{ time: string; msg: string }[]>([])
  const lastError           = ref('')   // 사용자에게 보여줄 에러 메시지

  let unlistenState:    UnlistenFn | null = null
  let unlistenProgress: UnlistenFn | null = null

  function addLog(msg: string) {
    const time = new Date().toTimeString().slice(0, 8)
    logs.value.push({ time, msg })
    console.log(`[${time}] ${msg}`)
  }

  // Rust 에러 문자열에서 사용자 친화적 메시지 추출
  function parseError(e: unknown): string {
    const raw = String(e)
    if (raw.includes('Connection refused'))    return '연결 거부됨 (호스트/포트 확인)'
    if (raw.includes('timed out'))             return '연결 시간 초과'
    if (raw.includes('Authentication'))        return '인증 실패 (사용자명/비밀번호 확인)'
    if (raw.includes('No such file'))          return '경로를 찾을 수 없음'
    if (raw.includes('Permission denied'))     return '권한 없음'
    return raw
  }

  async function connect(host: string, port: number, username: string, password: string, sessionLabel = ''): Promise<boolean> {
    lastError.value = ''
    try {
      addLog(`Connecting to ${host}:${port}...`)

      unlistenState = await listen<string>('sftp:state', (e) => {
        connState.value = e.payload
        addLog(`State → ${e.payload}`)
      })

      unlistenProgress = await listen<ProgressInfo>('sftp:progress', (e) => {
        progress.value = e.payload
      })

      const home = await invoke<string>('cmd_connect', { host, port, username, password })
      connected.value             = true
      connectedSessionName.value  = sessionLabel || `${username}@${host}`
      connectedSessionLabel.value = sessionLabel
      homeDir.value               = home
      remotePath.value            = home
      addLog(`Connected: ${username}@${host}`)
      await ls(home)
      return true
    } catch (e) {
      const msg = parseError(e)
      lastError.value = msg
      addLog(`Error: ${msg}`)
      unlistenState?.()
      unlistenProgress?.()
      return false   // 절대 re-throw 하지 않음
    }
  }

  async function disconnect() {
    try {
      await invoke('cmd_disconnect')
    } catch (_) {}
    connected.value             = false
    connState.value             = 'DISCONNECTED'
    connectedSessionName.value  = ''
    connectedSessionLabel.value = ''
    remoteFiles.value          = []
    remotePath.value           = '.'
    progress.value             = null
    lastError.value            = ''
    unlistenState?.()
    unlistenProgress?.()
    addLog('Disconnected.')
  }

  async function ls(path: string) {
    try {
      const entries = await invoke<FileEntry[]>('cmd_ls', { path })
      remoteFiles.value = entries.sort((a, b) => {
        if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      // 경로 정규화: 최소 1번이라도 ls 성공하면 해당 path로 확정
      remotePath.value = normalizePath(path)
    } catch (e) {
      addLog(`ls error: ${parseError(e)}`)
    }
  }

  // 상대경로 포함한 경로를 절대경로로 정규화
  function normalizePath(path: string): string {
    if (path === '.' || path === '') return remotePath.value || '/'
    if (!path.startsWith('/')) {
      // 상대경로: 현재 remotePath 기준으로 합침
      const base = (remotePath.value || '/').replace(/\/+$/, '')
      path = base + '/' + path
    }
    // .. 처리
    const parts = path.split('/').filter(Boolean)
    const resolved: string[] = []
    for (const p of parts) {
      if (p === '..') resolved.pop()
      else if (p !== '.') resolved.push(p)
    }
    return '/' + resolved.join('/')
  }

  async function cd(name: string) {
    const base = remotePath.value.replace(/\/+$/, '')
    const next = base === '' ? `/${name}` : `${base}/${name}`
    await ls(next)
  }

  async function cdUp() {
    const parts = remotePath.value.split('/').filter(Boolean)
    parts.pop()
    await ls(parts.length === 0 ? '/' : '/' + parts.join('/'))
  }

  async function rm(name: string) {
    const path = `${remotePath.value}/${name}`
    try {
      await invoke('cmd_rm', { path })
      addLog(`Removed: ${path}`)
      await ls(remotePath.value)
    } catch (e) {
      addLog(`rm error: ${parseError(e)}`)
    }
  }

  async function mkdir(name: string) {
    const path = `${remotePath.value}/${name}`
    try {
      await invoke('cmd_mkdir', { path })
      addLog(`Created: ${path}`)
      await ls(remotePath.value)
    } catch (e) {
      addLog(`mkdir error: ${parseError(e)}`)
    }
  }

  function cancelTransfer() {
    transferCancelled.value = true
    invoke('cmd_cancel_transfer').catch(() => {})
    addLog('Transfer cancelled by user')
    progress.value = null
  }

  return {
    connected, connState, connectedSessionName, connectedSessionLabel,
    homeDir, remotePath, remoteFiles, progress, logs, lastError,
    connect, disconnect, ls, cd, cdUp, rm, mkdir, addLog, cancelTransfer,
  }
})
