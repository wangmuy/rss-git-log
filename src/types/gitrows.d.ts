declare module 'gitrows' {
  interface GitRowsOptions {
    path: string;
    token?: string;
    mode?: 'fetch' | 'pull';
  }

  interface GitRowsClient {
    get(path: string): Promise<any>;
    put(path: string, data: any): Promise<boolean>;
    update(path: string, data: any, filter?: any): Promise<boolean>;
    delete(path: string, filter?: any): Promise<boolean>;
    create(path: string, data: any): Promise<boolean>;
    drop(path: string): Promise<boolean>;
  }

  function gitrows(options: GitRowsOptions): GitRowsClient;

  export = gitrows;
}