<script setup lang="ts">
// miniSFTP GUI - SessionModal
// author: kodeholic (powered by Claude)

import { ref, watchEffect } from 'vue'
import { X } from 'lucide-vue-next'
import { useSessionStore, type Session } from '../stores/sessions'

const props = defineProps<{
  show: boolean
  editSession?: Session | null
}>()

const emit = defineEmits<{
  close: []
}>()

const sessionStore = useSessionStore()

const name     = ref('')
const host     = ref('')
const port     = ref(22)
const username = ref('')
const password = ref('')

watchEffect(() => {
  if (props.show) {
    if (props.editSession) {
      name.value     = props.editSession.name
      host.value     = props.editSession.host
      port.value     = props.editSession.port
      username.value = props.editSession.username
      password.value = props.editSession.password
    } else {
      name.value     = ''
      host.value     = ''
      port.value     = 22
      username.value = ''
      password.value = ''
    }
  }
})

async function onSave() {
  if (!name.value.trim() || !host.value.trim() || !username.value.trim()) return

  const data = {
    name:     name.value.trim(),
    host:     host.value.trim(),
    port:     port.value || 22,
    username: username.value.trim(),
    password: password.value,
  }

  if (props.editSession) {
    await sessionStore.updateSession(props.editSession.id, data)
  } else {
    await sessionStore.addSession(data)
  }
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show"
      class="fixed inset-0 bg-black/25 backdrop-blur-[1px] flex items-center justify-center"
      style="z-index: 200;"
      @click.self="emit('close')">
      <div class="bg-zinc-900 border border-zinc-800 w-96 rounded-lg shadow-2xl overflow-hidden">

        <!-- 헤더 -->
        <div class="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 class="text-sm font-bold text-white">
            {{ editSession ? '세션 편집' : '새 세션' }}
          </h3>
          <button @click="emit('close')" class="text-zinc-500 hover:text-white transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- 폼 -->
        <div class="p-6 space-y-4">
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-zinc-500 uppercase">세션 이름</label>
            <input v-model="name" type="text" placeholder="예: AWS Production"
              class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs outline-none focus:border-blue-500 transition-colors text-zinc-200" />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-2 space-y-1">
              <label class="text-[11px] font-bold text-zinc-500 uppercase">호스트</label>
              <input v-model="host" type="text" placeholder="192.168.0.1"
                class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs outline-none focus:border-blue-500 transition-colors text-zinc-200" />
            </div>
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-zinc-500 uppercase">포트</label>
              <input v-model.number="port" type="text"
                class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs outline-none focus:border-blue-500 text-center transition-colors text-zinc-200" />
            </div>
          </div>
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-zinc-500 uppercase">사용자명</label>
            <input v-model="username" type="text" placeholder="ubuntu"
              class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs outline-none focus:border-blue-500 transition-colors text-zinc-200" />
          </div>
          <div class="space-y-1">
            <label class="text-[11px] font-bold text-zinc-500 uppercase">비밀번호</label>
            <input v-model="password" type="password" placeholder="••••••••"
              class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs outline-none focus:border-blue-500 transition-colors text-zinc-200" />
          </div>
        </div>

        <!-- 버튼 -->
        <div class="px-6 py-4 bg-zinc-950/50 flex justify-end space-x-3">
          <button @click="emit('close')"
            class="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors">
            취소
          </button>
          <button @click="onSave"
            :disabled="!name || !host || !username || !password"
            class="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2 rounded text-xs font-bold transition-colors">
            저장
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>
