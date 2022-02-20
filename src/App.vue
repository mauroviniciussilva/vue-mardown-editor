<template>
  <VueMarkdown v-model="text" />
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      text: 'Hello World',
    };
  },
};
</script>
