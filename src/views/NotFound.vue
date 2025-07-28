<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-foreground mb-4">404</h1>
      <p class="text-xl text-muted-foreground mb-8">页面未找到</p>
      <button
        @click="$router.push('/')"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        返回首页
      </button>
    </div>
  </div>
</template>