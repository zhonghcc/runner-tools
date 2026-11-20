<template>
  <view class="col">
    <view class="card">
      <text class="badge">筹备中</text>
      <text class="p top">按目标赛事、比赛日期和当前能力，生成分为基础期、强化期、巅峰期、减量期的周课表。每节课的配速直接取自你的训练区间，可以导出到手机日历。</text>
      <text class="muted p">设计原则：课表用规则生成，周跑量增幅控制在约 10% 以内，每三到四周安排一次减量，赛前两到三周进入减量期。同样的参数总能得到同一份课表，分享链接即可，不需要注册。</text>
      <text class="p">在它上线之前，可以先用<text class="link" @tap="go('/pages/vdot/index')">跑力与训练区间</text>确定训练配速，用<text class="link" @tap="go('/pages/aerobic/index')">有氧基础测试</text>判断是否可以开始加入间歇训练。</text>
    </view>
    <SiteFooter />
  </view>
</template>

<script setup lang="ts">
import SiteFooter from '../../components/SiteFooter.vue'
import { go } from '../../utils/platform'
</script>

<style scoped>
.top { margin-top: 8px; }
</style>
