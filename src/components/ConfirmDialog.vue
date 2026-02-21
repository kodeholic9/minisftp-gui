<script setup lang="ts">
// miniSFTP GUI - ConfirmDialog
// author: kodeholic (powered by Claude)

defineProps<{
  show: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="show"
      class="fixed inset-0 bg-black/25 backdrop-blur-[1px] flex items-center justify-center"
      style="z-index: 200;"
      @click.self="emit('cancel')">
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-80 overflow-hidden">

        <!-- 헤더 -->
        <div class="px-5 py-4 border-b border-zinc-800">
          <h3 class="text-sm font-bold text-white">{{ title ?? '확인' }}</h3>
        </div>

        <!-- 메시지 -->
        <div class="px-5 py-4">
          <p class="text-xs text-zinc-400 leading-relaxed">{{ message }}</p>
        </div>

        <!-- 버튼 -->
        <div class="px-5 py-3 bg-zinc-950/50 flex justify-end space-x-2">
          <button
            @click="emit('cancel')"
            class="px-4 py-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors">
            {{ cancelLabel ?? '취소' }}
          </button>
          <button
            @click="emit('confirm')"
            :class="danger ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-500'"
            class="px-4 py-1.5 text-xs font-bold text-white rounded transition-colors">
            {{ confirmLabel ?? '확인' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>
