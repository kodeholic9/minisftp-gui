<script setup lang="ts">
// miniSFTP GUI - BottomPane
// author: kodeholic (powered by Claude)

import { useSftpStore } from '../stores/sftp'

const store = useSftpStore()

function fmtSpeed(speed: number): string {
  if (speed < 1024) return `${speed} B/s`
  if (speed < 1024 * 1024) return `${(speed / 1024).toFixed(1)} KB/s`
  return `${(speed / 1024 / 1024).toFixed(1)} MB/s`
}
</script>

<template>
  <div class="flex flex-col overflow-hidden shrink-0 bg-zinc-900">

    <!-- 탭 헤더 -->
    <div class="flex items-center justify-between px-4 bg-black border-b border-zinc-800 shrink-0">
      <div class="flex items-center space-x-1">
        <span class="px-4 py-2 text-[10px] font-bold uppercase border-b-2 border-blue-500 text-white">
          LOGS
        </span>
        <button v-if="store.logs.length > 0"
          @click="store.logs = []"
          class="ml-1 px-2 py-1 text-[10px] text-zinc-600 hover:text-red-400 transition-colors">
          Clear
        </button>
      </div>

      <!-- 전송 중 상태 + 취소 버튼 -->
      <div v-if="store.progress" class="flex items-center space-x-3">
        <div class="text-[10px] font-mono text-zinc-400 flex items-center space-x-2">
          <span>{{ (store.progress.ratio * 100).toFixed(1) }}%</span>
          <span>{{ fmtSpeed(store.progress.speed) }}</span>
          <!-- 진행바 -->
          <div class="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div class="h-full bg-blue-500 transition-all"
              :style="{ width: `${store.progress.ratio * 100}%` }" />
          </div>
        </div>
        <button @click="store.cancelTransfer()"
          class="px-2 py-1 text-[10px] font-bold bg-red-800 hover:bg-red-600 text-white rounded transition-colors">
          취소
        </button>
      </div>
    </div>

    <!-- 로그 -->
    <div class="flex-grow overflow-y-auto p-3 custom-scrollbar">
      <div class="font-mono text-[10px] space-y-1 text-zinc-500 select-text cursor-text">
        <p v-for="(log, i) in store.logs" :key="i">
          <span class="text-zinc-700">[{{ log.time }}]</span> {{ log.msg }}
        </p>
        <p v-if="store.logs.length === 0" class="text-zinc-700 italic">No logs.</p>
      </div>
    </div>

  </div>
</template>
