<template>
  <template v-if="route.matched.length">
    <RouterView v-if="route.meta.layout === 'home'" />
    <ToolLayout v-else :title="(route.meta.title as string) ?? ''">
      <RouterView />
    </ToolLayout>
  </template>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import ToolLayout from './components/ToolLayout.vue'

const route = useRoute()
</script>
