// miniSFTP GUI - Local Filesystem Store
// author: kodeholic (powered by Claude)

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

export interface LocalEntry {
  name: string
  size: number
  is_dir: boolean
  mtime: string
}

export const useLocalStore = defineStore('local', () => {
  const currentPath = ref('C:\\')
  const entries     = ref<LocalEntry[]>([])
  const drives      = ref<string[]>([])

  async function loadDrives() {
    drives.value = await invoke<string[]>('cmd_local_drives')
    if (drives.value.length > 0) {
      const root = drives.value[0] + '\\'
      await ls(root)
    }
  }

  async function ls(path: string) {
    try {
      entries.value     = await invoke<LocalEntry[]>('cmd_local_ls', { path })
      currentPath.value = path
    } catch (e) {
      console.error('local ls error:', e)
    }
  }

  async function cd(name: string) {
    const sep  = currentPath.value.includes('/') ? '/' : '\\'
    const next = currentPath.value.replace(/[\\/]+$/, '') + sep + name
    await ls(next)
  }

  async function cdUp() {
    const sep   = currentPath.value.includes('/') ? '/' : '\\'
    const parts = currentPath.value.replace(/[\\/]+$/, '').split(sep).filter(Boolean)
    if (parts.length <= 1) return
    parts.pop()
    const next = currentPath.value.startsWith('/')
      ? '/' + parts.join('/')
      : parts.join('\\') + '\\'
    await ls(next)
  }

  return { currentPath, entries, drives, loadDrives, ls, cd, cdUp }
})
