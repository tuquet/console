export interface RegisteredMicroApp {
  id: string;
  name: string;
  version: string;
  devPort: number;
  defaultPath: string;
  icon: string;
  titleKey: string;
  order: number;
}

export interface AppRegistryManifest {
  version: string;
  generatedAt: string;
  apps: Record<string, RegisteredMicroApp>;
}

export const APP_REGISTRY: Record<string, RegisteredMicroApp> = {
  automation: {
    id: 'automation',
    name: 'Automation Mesh',
    version: '0.1.0',
    devPort: 5321,
    defaultPath: 'overview',
    icon: 'lucide:workflow',
    titleKey: 'page.automation.title',
    order: 20,
  },
  system: {
    id: 'system',
    name: 'System & Hardware Mesh',
    version: '0.1.0',
    devPort: 5322,
    defaultPath: 'overview',
    icon: 'lucide:shield-check',
    titleKey: 'page.system.title',
    order: 30,
  },
  workspaces: {
    id: 'workspaces',
    name: 'Multi-Workspace Hub',
    version: '0.1.0',
    devPort: 5323,
    defaultPath: 'overview',
    icon: 'lucide:building-2',
    titleKey: 'page.workspaces.title',
    order: 40,
  },
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    version: '0.1.0',
    devPort: 5324,
    defaultPath: 'overview',
    icon: 'lucide:layers',
    titleKey: 'page.tasks.title',
    order: 50,
  },
  logs: {
    id: 'logs',
    name: 'Logs',
    version: '0.1.0',
    devPort: 5325,
    defaultPath: 'overview',
    icon: 'lucide:scroll-text',
    titleKey: 'page.logs.title',
    order: 25,
  },
};

export function getRegisteredApp(id: string): RegisteredMicroApp | undefined {
  return APP_REGISTRY[id];
}
