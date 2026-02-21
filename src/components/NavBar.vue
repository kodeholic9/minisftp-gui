<script setup lang="ts">
// miniSFTP GUI - NavBar
// author: kodeholic (powered by Claude)

import { ref, onMounted, onUnmounted } from 'vue'
import { Server, ChevronDown, Plus, Trash2, Pencil } from 'lucide-vue-next'
import { useSftpStore } from '../stores/sftp'
import { useSessionStore, type Session } from '../stores/sessions'
import SessionModal from './SessionModal.vue'
import ConfirmDialog from './ConfirmDialog.vue'

const sftp         = useSftpStore()
const sessionStore = useSessionStore()

const showDropdown      = ref(false)
const showModal         = ref(false)
const editingSession    = ref<Session | null>(null)
const dropdownRef       = ref<HTMLElement | null>(null)
const showConfirm       = ref(false)
const confirmTargetId   = ref<string | null>(null)
const showReconnect     = ref(false)
const pendingSession    = ref<Session | null>(null)

onMounted(async () => {
  await sessionStore.loadSessions()
  document.addEventListener('mousedown', onOutsideClick)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onOutsideClick)
})

function onOutsideClick(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}

async function selectSession(s: Session) {
  showDropdown.value = false
  if (sftp.connected) {
    pendingSession.value = s
    showReconnect.value  = true
    return
  }
  await sftp.connect(s.host, s.port, s.username, s.password, s.name)
}

async function onConfirmReconnect() {
  showReconnect.value = false
  if (!pendingSession.value) return
  const s = pendingSession.value
  pendingSession.value = null
  await sftp.disconnect()
  await sftp.connect(s.host, s.port, s.username, s.password, s.name)
}

function openAddModal() {
  editingSession.value = null
  showModal.value      = true
  showDropdown.value   = false
}

function openEditModal(e: Event, s: Session) {
  e.stopPropagation()
  editingSession.value = { ...s }
  showModal.value      = true
  showDropdown.value   = false
}

function promptRemoveSession(e: Event, id: string) {
  e.stopPropagation()
  confirmTargetId.value = id
  showConfirm.value     = true
  showDropdown.value    = false
}

async function onConfirmRemove() {
  if (confirmTargetId.value) {
    await sessionStore.removeSession(confirmTargetId.value)
  }
  showConfirm.value     = false
  confirmTargetId.value = null
}
</script>

<template>
  <nav class="bg-zinc-900 border-b border-black px-4 py-2 flex items-center space-x-3 shrink-0" style="z-index:50">

    <!-- 세션 드롭다운 -->
    <div ref="dropdownRef" class="relative">
      <button
        @click="showDropdown = !showDropdown"
        class="flex items-center justify-between w-56 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-xs font-bold transition-colors">
        <div class="flex items-center space-x-2 overflow-hidden">
          <Server class="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span class="truncate text-zinc-300">
            {{ sftp.connected ? sftp.connectedSessionName : '세션 선택' }}
          </span>
        </div>
        <ChevronDown class="w-3 h-3 text-zinc-500 shrink-0" />
      </button>

      <div v-if="showDropdown"
        class="absolute top-full left-0 mt-1 w-64 bg-zinc-900 border border-zinc-800 rounded-md shadow-2xl py-1"
        style="z-index:100">

        <div class="px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-800">
          저장된 세션
        </div>

        <ul class="max-h-56 overflow-y-auto">
          <li v-if="sessionStore.sessions.length === 0"
            class="px-3 py-2 text-[11px] text-zinc-600 italic">
            저장된 세션 없음
          </li>
          <li
            v-for="s in sessionStore.sessions"
            :key="s.id"
            class="flex items-center justify-between px-3 py-2 hover:bg-zinc-800 cursor-pointer group transition-colors"
            @mousedown.stop="selectSession(s)">
            <div class="overflow-hidden flex-grow">
              <p class="text-[11px] font-bold text-zinc-300 truncate">{{ s.name }}</p>
              <p class="text-[9px] text-zinc-500">{{ s.username }}@{{ s.host }}:{{ s.port }}</p>
            </div>
            <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all ml-2 shrink-0">
              <button
                @mousedown.stop="openEditModal($event, s)"
                class="text-zinc-600 hover:text-blue-400 p-0.5 transition-colors"
                title="편집">
                <Pencil class="w-3 h-3" />
              </button>
              <button
                @mousedown.stop="promptRemoveSession($event, s.id)"
                class="text-zinc-600 hover:text-red-500 p-0.5 transition-colors"
                title="삭제">
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </li>
        </ul>

        <hr class="border-zinc-800 my-1" />
        <button
          @mousedown.stop="openAddModal"
          class="w-full flex items-center px-3 py-1.5 text-[11px] hover:bg-blue-600 hover:text-white transition-colors">
          <Plus class="w-3.5 h-3.5 mr-2" /> 새 세션 추가...
        </button>
      </div>
    </div>

    <!-- 연결 해제 버튼 (연결 중일 때만 표시) -->
    <button v-if="sftp.connected"
      @click="sftp.disconnect()"
      class="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">
      연결 해제
    </button>

    <!-- 상태 / 에러 -->
    <div class="ml-auto text-[10px] font-mono shrink-0 max-w-xs truncate">
      <span v-if="sftp.lastError" class="text-red-400">{{ sftp.lastError }}</span>
      <span v-else-if="sftp.connected" class="text-green-500">● {{ sftp.connState }}</span>
      <span v-else class="text-zinc-500">{{ sftp.connState }}</span>
    </div>

  </nav>

  <SessionModal
    :show="showModal"
    :edit-session="editingSession"
    @close="showModal = false" />

  <ConfirmDialog
    :show="showConfirm"
    title="세션 삭제"
    message="이 세션을 삭제하시겠습니까?"
    confirm-label="삭제"
    :danger="true"
    @confirm="onConfirmRemove"
    @cancel="showConfirm = false" />

  <ConfirmDialog
    :show="showReconnect"
    title="재연결"
    :message="`현재 '${sftp.connectedSessionName}' 에 연결되어 있습니다. 연결을 끊고 '${pendingSession?.name ?? ''}' 에 연결하시겠습니까?`"
    confirm-label="재연결"
    :danger="false"
    @confirm="onConfirmReconnect"
    @cancel="showReconnect = false" />
</template>
