<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';
import { loadTurnstile, TURNSTILE_SITE_KEY } from '#/utils/turnstile';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const turnstileContainerRef = ref<HTMLDivElement | null>(null);
const turnstileToken = ref<string>('');
let widgetId: null | string = null;

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.emailTip'),
      },
      fieldName: 'username',
      label: $t('authentication.email'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.emailTip') })
        .email({ message: $t('authentication.emailValidErrorTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.passwordTip'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
  ];
});

async function initTurnstile() {
  try {
    await loadTurnstile();
    if (window.turnstile && turnstileContainerRef.value && !widgetId) {
      widgetId = window.turnstile.render(turnstileContainerRef.value, {
        sitekey: TURNSTILE_SITE_KEY,
        mode: 'invisible',
        callback: (token: string) => {
          turnstileToken.value = token;
        },
        'expired-callback': () => {
          turnstileToken.value = '';
          if (widgetId && window.turnstile) {
            window.turnstile.reset(widgetId);
          }
        },
        'error-callback': () => {
          turnstileToken.value = '';
        },
      });
    }
  } catch {
    // Non-blocking in case script is blocked
  }
}

async function handleLogin(values: Recordable<any>) {
  try {
    await authStore.authLogin({
      ...values,
      captchaToken: turnstileToken.value,
    });
  } catch (error) {
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId);
    }
    throw error;
  }
}

onMounted(() => {
  initTurnstile();
});

onBeforeUnmount(() => {
  if (widgetId && window.turnstile) {
    try {
      window.turnstile.remove(widgetId);
    } catch {}
  }
});
</script>

<template>
  <div>
    <div
      ref="turnstileContainerRef"
      style="
        position: absolute;
        width: 0;
        height: 0;
        overflow: hidden;
        pointer-events: none;
        opacity: 0;
      "
    ></div>
    <AuthenticationLogin
      :form-schema="formSchema"
      :loading="authStore.loginLoading"
      :show-code-login="false"
      :show-forget-password="false"
      :show-qrcode-login="false"
      :show-register="false"
      :show-third-party-login="false"
      @submit="handleLogin"
    />
  </div>
</template>
