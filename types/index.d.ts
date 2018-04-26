// Type definitions for umpack-express ^1.11
// Project: https://github.com/liz4rdcom/umpack-express
// Definitions by: Irakli Jishkariani <https://github.com/irakli2692>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.2

import { IRouter, RequestHandler, Request } from "express-serve-static-core";

declare function umpack(options: umpack.UmpackExpressOptions): umpack.UmpackExpress;

declare namespace umpack {
  interface Logger {
    error: (message: any, ...restParams: any[]) => any;
    warn: (message: any, ...restParams: any[]) => any;
    info: (message: any, ...restParams: any[]) => any;
    debug: (message: any, ...restParams: any[]) => any;
    trace: (message: any, ...restParams: any[]) => any;
  }

  interface SmtpOptions {
    host: string;
    port: number;
    user: string;
    password: string;
    timeout?: number;
    ssl?: boolean;
  }

  interface PasswordResetEmailOptions {
    smtpData: SmtpOptions;
    senderEmail: string;
    resetKeyExpiresIn?: string;
    passwordMessageFunction?: (key: string) => string; // key is password reset key
    passwordWrongEmailInstruction?: (clientIp: string) => string;
  }

  interface PasswordResetPhoneOptions {
    resetKeyExpiresIn: string;
    sendResetKey: (phone: string, resetKey: string) => void | Promise<any>;
  }

  interface UmpackExpressOptions {
    mongodbConnectionString: string;
    accessTokenSecret: string;
    passwordHashSecret: string;
    accessTokenExpiresIn?: string;
    cookieAccessTokenName?: string;
    passwordResetData?: PasswordResetEmailOptions;
    passwordResetPhoneData?: PasswordResetPhoneOptions;
    deviceControl?: boolean;
    userNameCaseSensitive?: boolean;
    logger?: Logger;
  }

  interface SignupRequest {
    userName: string;
    password: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    address?: string;
    additionalInfo?: string;
  }

  interface UmpackExpress {
    router: IRouter;
    isAuthorized: RequestHandler;
    updateUserMetaData: (userName: string, metaDataObject: any) => Promise<any>;
    getUserMetaDataByUserName: (userName: string) => Promise<any>;
    getUserMetaDataByRequest: (req: Request) => Promise<any>;
    filterUsersByMetaData: (key: string, value: any) => Promise<any[]>;
    getFullName: (userName: string) => Promise<string>;
    getUserRolesByUserName: (userName: string) => Promise<any>;
    getUserRolesFromRequest: (req: Request) => Promise<any>;
    getFullUserObject: (userName: string) => Promise<any>;
    getFullUserObjectFromRequest: (req: Request) => Promise<any>;
    filterUsersByRole: (role: string) => Promise<any>;
    /**
     * if deviceControl is enabled, deviceToken is required.
     * returns password
     */
    init: (umBaseUrl: string, passwordText?: string, deviceToken?: string) => Promise<string>;
    /**
     * init user with full api access
     * if deviceControl is enabled, deviceToken is required.
     * returns password
     */
    initWithFullAccess: (umBaseUrl: string, deviceToken?: string) => Promise<string>;
    getUserNameFromRequest: (req: Request) => Promise<string>;
    signup: (userData: SignupRequest) => Promise<any>;
  }
}

export = umpack;
