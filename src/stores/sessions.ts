// miniSFTP GUI - Session Store
// author: kodeholic (powered by Claude)
//
// tauri-plugin-store 기반 퍼머넌트 세션 관리
// 저장 위치: 앱 데이터 디렉토리 / sessions.json

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { load } from '@tauri-apps/plugin-store'

export interface Session {
  id: string
  name: string
  host: string
  port: number
  username: string
  password: string  // TODO: 향후 OS 키체인 암호화 처리
}

const STORE_FILE = 'sessions.json'
const STORE_KEY  = 'sessions'

export const useSessionStore = defineStore('sessions', () => {
  const sessions = ref<Session[]>([])

  // store 인스턴스 (lazy init)
  async function getStore() {
    return await load(STORE_FILE, { autoSave: true, defaults: {} })
  }

  async function loadSessions() {
    const store = await getStore()
    const saved = await store.get<Session[]>(STORE_KEY)
    sessions.value = saved ?? []
  }

  async function addSession(session: Omit<Session, 'id'>) {
    const newSession: Session = {
      ...session,
      id: crypto.randomUUID(),
    }
    sessions.value.push(newSession)
    await persist()
    return newSession
  }

  async function updateSession(id: string, data: Partial<Omit<Session, 'id'>>) {
    const idx = sessions.value.findIndex(s => s.id === id)
    if (idx === -1) return
    sessions.value[idx] = { ...sessions.value[idx], ...data }
    await persist()
  }

  async function removeSession(id: string) {
    sessions.value = sessions.value.filter(s => s.id !== id)
    await persist()
  }

  async function persist() {
    const store = await getStore()
    await store.set(STORE_KEY, sessions.value)
  }

  return { sessions, loadSessions, addSession, updateSession, removeSession }
})
