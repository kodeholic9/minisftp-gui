<script setup lang="ts">
// miniSFTP GUI - LocalPane
// author: kodeholic (powered by Claude)

import { onMounted } from 'vue'
import { Folder, File, ArrowUp, Monitor, Upload } from 'lucide-vue-next'
import { invoke } from '@tauri-apps/api/core'
import { useLocalStore } from '../stores/local'
import { useSftpStore } from '../stores/sftp'
import { ref } from 'vue'

const local  = useLocalStore()
const sftp   = useSftpStore()

const ctxMenu   = ref({ show: false, x: 0, y: 0 })
const ctxTarget = ref<{ name: string; is_dir: boolean } | null>(null)

onMounted(() => local.loadDrives())

function onDriveChange(e: Event) {
  const drive = (e.target as HTMLSelectElement).value
  local.ls(drive + '\\')
}

function onRowDblClick(name: string, isDir: boolean) {
  if (isDir) local.cd(name)
}

function onRowContextMenu(e: MouseEvent, name: string, isDir: boolean) {
  e.preventDefault()
  ctxTarget.value = { name, is_dir: isDir }
  ctxMenu.value   = { show: true, x: e.clientX, y: e.clientY }
}

function closeCtx() { ctxMenu.value.show = false }

async function upload() {
  if (!ctxTarget.value) return
  closeCtx()
  const sep    = local.currentPath.includes('/') ? '/' : '\\'
  const local_ = local.currentPath.replace(/[\\/]+$/, '') + sep + ctxTarget.value.name
  const remote = `${sftp.remotePath}/${ctxTarget.value.name}`
  try {
    const result = await invoke<string>('cmd_put', { local: local_, remote })
    sftp.addLog(`Upload OK: ${result}`)
    sftp.progress = null
    await sftp.ls(sftp.remotePath)
  } catch (e) {
    sftp.progress = null
    sftp.addLog(`Upload error: ${e}`)
  }
}

function fmtSize(size: number, isDir: boolean): string {
  if (isDir) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
  <section class="flex flex-col h-full overflow-hidden border-r border-zinc-800" @click="closeCtx">

    <!-- 헤더 -->
    <div class="h-9 flex items-center justify-between px-4 bg-zinc-900/50 border-b border-zinc-800 shrink-0">
      <div class="flex items-center space-x-2">
        <Monitor class="w-3.5 h-3.5 text-zinc-500" />
        <span class="text-xs font-bold uppercase">Local</span>
      </div>
      <span class="text-[10px] text-zinc-500 font-mono">{{ local.entries.length }} items</span>
    </div>

    <!-- 경로 바 -->
    <div class="h-9 px-2 bg-zinc-900 border-b border-zinc-800 flex items-center space-x-1 shrink-0">
      <select :value="local.currentPath.slice(0, 2)" @change="onDriveChange"
        class="bg-zinc-800 rounded px-2 py-1 text-[10px] font-bold text-zinc-400 outline-none cursor-pointer shrink-0">
        <option v-for="d in local.drives" :key="d" :value="d">{{ d }}</option>
      </select>
      <button @click="local.cdUp()" class="p-1 hover:bg-zinc-800 rounded text-zinc-400 transition-colors">
        <ArrowUp class="w-3.5 h-3.5" />
      </button>
      <input :value="local.currentPath" readonly
        class="bg-zinc-800 border-none rounded px-2 py-1 text-xs w-full outline-none text-zinc-300 min-w-0" />
    </div>

    <!-- 파일 목록 -->
    <div class="flex-grow overflow-y-auto custom-scrollbar">
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 bg-zinc-950 z-10 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
          <tr class="text-zinc-500 text-[9px] uppercase font-bold">
            <th class="px-3 py-2 border-b border-zinc-800">Name</th>
            <th class="px-3 py-2 border-b border-zinc-800 text-right w-20">Size</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in local.entries" :key="entry.name"
            @dblclick="onRowDblClick(entry.name, entry.is_dir)"
            @contextmenu="onRowContextMenu($event, entry.name, entry.is_dir)"
            class="cursor-pointer hover:bg-zinc-900 border-b border-zinc-900/50 transition-colors">
            <td class="px-3 py-1.5 flex items-center space-x-2">
              <Folder v-if="entry.is_dir" class="w-3.5 h-3.5 shrink-0 text-amber-500/80" />
              <File v-else class="w-3.5 h-3.5 shrink-0 text-zinc-500" />
              <span class="text-xs truncate">{{ entry.name }}</span>
            </td>
            <td class="px-3 py-1.5 text-[10px] text-right text-zinc-600 font-mono">
              {{ fmtSize(entry.size, entry.is_dir) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- 컨텍스트 메뉴: 업로드만 -->
  <Teleport to="body">
    <div v-if="ctxMenu.show"
      class="fixed bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl py-1"
      :style="{ top: `${ctxMenu.y}px`, left: `${ctxMenu.x}px`, zIndex: 300, minWidth: '140px' }"
      @click.stop>
      <button @click="upload"
        :disabled="!sftp.connected"
        class="w-full flex items-center px-3 py-2 text-xs transition-colors"
        :class="sftp.connected
          ? 'text-green-400 hover:bg-green-700 hover:text-white'
          : 'text-zinc-600 cursor-not-allowed'">
        <Upload class="w-3.5 h-3.5 mr-2 shrink-0" />
        {{ sftp.connected ? '업로드' : '업로드 (연결 필요)' }}
      </button>
    </div>
    <div v-if="ctxMenu.show" class="fixed inset-0" style="z-index:299" @click="closeCtx" />
  </Teleport>
</template>
