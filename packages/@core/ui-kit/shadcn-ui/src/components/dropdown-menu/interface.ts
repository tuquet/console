import type { Component } from 'vue';

interface OperonDropdownMenuItem {
  disabled?: boolean;
  /**
   * Click event handler
   * @param data
   */
  handler?: (data: any) => void;
  /**
   * Icon
   */
  icon?: Component;
  /**
   * Title
   */
  label: string;
  /**
   * Whether it is a divider
   */
  separator?: boolean;
  /**
   * Unique identifier
   */
  value: string;
}

interface DropdownMenuProps {
  menus: OperonDropdownMenuItem[];
}

export type { DropdownMenuProps, OperonDropdownMenuItem };
