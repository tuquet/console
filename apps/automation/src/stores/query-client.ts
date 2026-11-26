import { QueryClient, useQueryClient } from '@tanstack/vue-query';

let fallbackClient: null | QueryClient = null;

export function getAutomationQueryClient(): QueryClient {
  try {
    return useQueryClient();
  } catch {
    if (!fallbackClient) {
      fallbackClient = new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      });
    }
    return fallbackClient;
  }
}

export function resetFallbackQueryClient(): void {
  fallbackClient?.clear();
}
