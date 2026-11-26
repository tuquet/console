export type {
  AlertProps,
  BeforeCloseScope,
  IconType,
  PromptProps,
} from './alert';
export { useAlertContext } from './alert';
export {
  operonAlert as alert,
  clearAllAlerts,
  operonConfirm as confirm,
  operonPrompt as prompt,
} from './alert-builder';
export { default as Alert } from './alert.vue';
