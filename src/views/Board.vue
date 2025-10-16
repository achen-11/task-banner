<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { computed } from 'vue'

const route = useRoute()
const projectStore = useProjectStore()

const projectId = computed(() => route.params.projectId as string)
const project = computed(() => projectStore.getProjectById(projectId.value))
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <div v-if="project" class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ project.name }}</h1>
        <p class="text-gray-600">{{ project.description }}</p>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-8 text-center">
        <p class="text-gray-500">任务看板功能即将实现...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
