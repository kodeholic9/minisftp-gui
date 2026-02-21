<script setup lang="ts">
// miniSFTP GUI - RemotePane
// author: kodeholic (powered by Claude)

import { ref, computed } from 'vue'
import { Folder, File, ArrowUp, Home, HardDrive, FolderPlus, Download, Trash2 } from 'lucide-vue-next'
import { invoke } from '@tauri-apps/api/core'
import { useSftpStore } from '../stores/sftp'
import { useLocalStore } from '../stores/local'
import ConfirmDialog from './ConfirmDialog.vue'

const store = useSftpStore()
const local = useLocalStore()

// 홈 디렉토리: sftp store의 connectedSessionName에서 username 추출
const homeDir = computed(() => {
  // connectedSessionName = "라즈베리 서버" (세션명) 또는 "tgkang@192.168.0.29"
  // 실제 홈경로는 connect 시 받은 경로 기준으로 추적
  // remotePath의 최상위 2단계까지를 홈으로 간주 (e.g. /home/tgkang)
  const parts = store.remotePath.split('/').filter(Boolean)
  if (parts.length >= 2 && parts[0] === 'home') {
    return '/' + parts.slice(0, 2).join('/')
  }
  if (parts.length >= 1 && parts[0] === 'root') return '/root'
  // 알 수 없으면 현재 remotePath의 최초 경로 유지 - sftp store에서 homeDir 노출
  return store.homeDir
})

const ctxMenu   = ref({ show: false, x: 0, y: 0 })
const ctxTarget = ref<{ name: string; is_dir: boolean } | null>(null)

const showConfirm = ref(false)
const confirmMsg  = ref('')

function onRowDblClick(name: string, isDir: boolean) {
  if (isDir) store.cd(name)
}

function onRowContextMenu(e: MouseEvent, name: string, isDir: boolean) {
  e.preventDefault()
  ctxTarget.value = { name, is_dir: isDir }
  ctxMenu.value   = { show: true, x: e.clientX, y: e.clientY }
}

function closeCtx() { ctxMenu.value.show = false }

async function download() {
  if (!ctxTarget.value) return
  closeCtx()
  const remote    = `${store.remotePath}/${ctxTarget.value.name}`
  const sep       = local.currentPath.includes('/') ? '/' : '\\'
  const localPath = local.currentPath.replace(/[\\/]+$/, '') + sep + ctxTarget.value.name
  try {
    const result = await invoke<string>('cmd_get', { remote, local: localPath })
      store.addLog(`Download OK: ${result}`)
      store.progress = null
      await local.ls(local.currentPath)
  } catch (e) {
    store.progress = null
    store.addLog(`Download error: ${e}`)
  }
}

function promptDelete() {
  if (!ctxTarget.value) return
  closeCtx()
  confirmMsg.value  = `"${ctxTarget.value.name}" 을 삭제하시겠습니까?`
  showConfirm.value = true
}

async function onConfirmDelete() {
  showConfirm.value = false
  if (!ctxTarget.value) return
  await store.rm(ctxTarget.value.name)
}

async function mkdir() {
  const name = prompt('새 폴더 이름:')
  if (name?.trim()) await store.mkdir(name.trim())
}

function fmtSize(size: number, isDir: boolean): string {
  if (isDir) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
  <section class="flex flex-col h-full overflow-hidden" @click="closeCtx">

    <!-- 헤더 -->
    <div class="h-9 flex items-center justify-between px-4 bg-zinc-900/50 border-b border-zinc-800 shrink-0">
      <div class="flex items-center space-x-2">
        <HardDrive class="w-3.5 h-3.5 text-blue-400" />
        <span class="text-xs font-bold uppercase">Remote</span>
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-[10px] text-zinc-500 font-mono">{{ store.remoteFiles.length }} items</span>
        <button v-if="store.connected"
          @click.stop="mkdir"
          class="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
          title="새 폴더">
          <FolderPlus class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 경로 바 -->
    <div class="h-9 px-2 bg-zinc-900 border-b border-zinc-800 flex items-center space-x-1 shrink-0">
      <button
        :disabled="!store.connected"
        @click="store.connected && store.ls(homeDir)"
        :class="store.connected ? 'text-zinc-400 hover:bg-zinc-800 hover:text-blue-400' : 'text-zinc-700 cursor-not-allowed'"
        class="p-1 rounded transition-colors"
        title="홈으로">
        <Home class="w-3.5 h-3.5" />
      </button>
      <button
        :disabled="!store.connected"
        @click="store.connected && store.cdUp()"
        :class="store.connected ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'"
        class="p-1 rounded transition-colors">
        <ArrowUp class="w-3.5 h-3.5" />
      </button>
      <input :value="store.connected ? store.remotePath : ''"
        readonly
        :class="store.connected ? 'text-zinc-300' : 'text-zinc-700'"
        class="bg-zinc-800 border-none rounded px-2 py-1 text-xs w-full outline-none" />
    </div>

    <!-- 파일 목록 -->
    <div class="flex-grow overflow-y-auto custom-scrollbar">
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-zinc-950 z-10 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
          <tr class="text-zinc-500 text-[9px] uppercase font-bold">
            <th class="px-3 py-2 border-b border-zinc-800">Name</th>
            <th class="px-3 py-2 border-b border-zinc-800 text-right w-24">Size</th>
            <th class="px-3 py-2 border-b border-zinc-800 w-32">Modified</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!store.connected">
            <td colspan="3" class="px-3 py-8 text-center text-xs text-zinc-600 italic">
              연결 후 파일 목록이 표시됩니다.
            </td>
          </tr>
          <tr v-for="file in store.remoteFiles" :key="file.name"
            @dblclick="onRowDblClick(file.name, file.is_dir)"
            @contextmenu="onRowContextMenu($event, file.name, file.is_dir)"
            class="group cursor-pointer hover:bg-zinc-900 border-b border-zinc-900/50 transition-colors">
            <td class="px-3 py-1.5 flex items-center space-x-2">
              <Folder v-if="file.is_dir" class="w-3.5 h-3.5 shrink-0 text-amber-500/80" />
              <File v-else class="w-3.5 h-3.5 shrink-0 text-zinc-500" />
              <span class="text-xs truncate">{{ file.name }}</span>
            </td>
            <td class="px-3 py-1.5 text-[10px] text-right text-zinc-600 font-mono">
              {{ fmtSize(file.size, file.is_dir) }}
            </td>
            <td class="px-3 py-1.5 text-[10px] text-zinc-600 font-mono">
              {{ file.mtime }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- 컨텍스트 메뉴 -->
  <Teleport to="body">
    <div v-if="ctxMenu.show"
      class="fixed bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl py-1"
      :style="{ top: `${ctxMenu.y}px`, left: `${ctxMenu.x}px`, zIndex: 300, minWidth: '140px' }"
      @click.stop>
      <!-- 다운로드 -->
      <button @click="download"
        class="w-full flex items-center px-3 py-2 text-xs text-blue-400 hover:bg-blue-600 hover:text-white transition-colors">
        <Download class="w-3.5 h-3.5 mr-2 shrink-0" /> 다운로드
      </button>
      <hr class="border-zinc-700 my-1" />
      <!-- 삭제 -->
      <button @click="promptDelete"
        class="w-full flex items-center px-3 py-2 text-xs text-red-400 hover:bg-red-700 hover:text-white transition-colors">
        <Trash2 class="w-3.5 h-3.5 mr-2 shrink-0" /> 삭제
      </button>
    </div>
    <div v-if="ctxMenu.show" class="fixed inset-0" style="z-index:299" @click="closeCtx" />
  </Teleport>

  <ConfirmDialog
    :show="showConfirm"
    title="파일 삭제"
    :message="confirmMsg"
    confirm-label="삭제"
    :danger="true"
    @confirm="onConfirmDelete"
    @cancel="showConfirm = false" />
</template>
