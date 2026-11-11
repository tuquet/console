import { ref } from 'vue';

import { defineStore } from 'pinia';

export const usePlaygroundStore = defineStore('playground:sample', () => {
  const counter = ref(0);
  function increment() {
    counter.value += 1;
  }
  return { counter, increment };
});
