import type { BasicUserInfo } from '@vben-core/typings';

/** User info */
interface UserInfo extends BasicUserInfo {
  /**
   * User description
   */
  desc: string;
  /**
   * Home path
   */
  homePath: string;

  /**
   * accessToken
   */
  token: string;
}

export type { UserInfo };
