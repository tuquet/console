import { ref } from 'vue';

import { message } from 'ant-design-vue';

export function useClipboard() {
  const copiedField = ref<null | string>(null);

  async function copyToClipboard(
    text: string,
    label: string = 'Nội dung',
  ): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      copiedField.value = label;
      message.success(`Đã sao chép ${label}`);
      setTimeout(() => {
        if (copiedField.value === label) {
          copiedField.value = null;
        }
      }, 2000);
      return true;
    } catch {
      message.error(`Không thể sao chép ${label}`);
      return false;
    }
  }

  function isCopied(label: string): boolean {
    return copiedField.value === label;
  }

  return {
    copiedField,
    copyToClipboard,
    isCopied,
  };
}
