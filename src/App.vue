<script setup lang="ts">
// miniSFTP GUI - App Root
// author: kodeholic (powered by Claude)

import { ref } from 'vue'
import NavBar from './components/NavBar.vue'
import LocalPane from './components/LocalPane.vue'
import RemotePane from './components/RemotePane.vue'
import BottomPane from './components/BottomPane.vue'

// 좌우 분할 비율
const leftPercent = ref(50)
let isHResizing = false

// 상하 분할
const bottomHeight = ref(180)
let isVResizing = false

window.addEventListener('mousemove', (e) => {
  if (isHResizing) {
    leftPercent.value = Math.min(80, Math.max(20, (e.clientX / window.innerWidth) * 100))
  }
  if (isVResizing) {
    bottomHeight.value = Math.min(400, Math.max(80, window.innerHeight - e.clientY))
  }
})
window.addEventListener('mouseup', () => {
  isHResizing = false
  isVResizing = false
})
</script>

<template>
  <div class="bg-zinc-950 text-zinc-300 h-screen w-screen overflow-hidden flex flex-col select-none">

    <!-- 커넥션 바 -->
    <NavBar />

    <!-- 메인: 좌(Local) + 우(Remote) -->
    <div class="flex-grow overflow-hidden min-h-0 flex items-stretch relative">

      <!-- Local Pane -->
      <div :style="{ width: `${leftPercent}%` }" class="h-full overflow-hidden">
        <LocalPane />
      </div>

      <!-- 수평 리사이저 -->
      <div @mousedown="isHResizing = true"
        class="w-1 cursor-col-resize hover:bg-blue-600 bg-zinc-800 transition-colors z-30 shrink-0" />

      <!-- Remote Pane -->
      <div :style="{ width: `${100 - leftPercent}%` }" class="h-full overflow-hidden">
        <RemotePane />
      </div>

    </div>

    <!-- 수직 리사이저 -->
    <div @mousedown="isVResizing = true"
      class="h-1 cursor-row-resize bg-zinc-800 hover:bg-blue-600 transition-colors z-40 shrink-0" />

    <!-- 하단 패널 -->
    <BottomPane :style="{ height: `${bottomHeight}px` }" />

  </div>
</template>

<style>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
</style>
