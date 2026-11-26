<script setup lang="ts">
import type { Recordable } from '@operon/types';

import type { OperonFormSchema } from '@operon-core/form-ui';

import { computed, reactive } from 'vue';

import { $t } from '@operon/locales';

import { useOperonForm } from '@operon-core/form-ui';
import { OperonButton } from '@operon-core/shadcn-ui';

interface Props {
  formSchema?: OperonFormSchema[];
}

const props = withDefaults(defineProps<Props>(), {
  formSchema: () => [],
});

const emit = defineEmits<{
  submit: [Recordable<any>];
}>();

const [Form, formApi] = useOperonForm(
  reactive({
    commonConfig: {
      // All form fields
      componentProps: {
        class: 'w-full',
      },
    },
    layout: 'horizontal',
    schema: computed(() => props.formSchema),
    showDefaultActions: false,
  }),
);

async function handleSubmit() {
  const { valid } = await formApi.validate();
  const values = await formApi.getValues();
  if (valid) {
    emit('submit', values);
  }
}

defineExpose({
  getFormApi: () => formApi,
});
</script>
<template>
  <div @keydown.enter.prevent="handleSubmit">
    <Form />
    <OperonButton type="submit" class="mt-4" @click="handleSubmit">
      {{ $t('profile.updateBasicProfile') }}
    </OperonButton>
  </div>
</template>
