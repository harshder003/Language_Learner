declare module 'sql.js' {
  export interface Database {
    prepare(sql: string): Statement
    run(sql: string): void
    exec(sql: string): Array<{ columns: string[]; values: any[][] }>
    close(): void
    export(): Uint8Array
  }

  export interface Statement {
    bind(values: any[]): void
    step(): boolean
    getAsObject(): { [key: string]: any }
    free(): void
    reset(): void
  }

  export interface InitSqlJsConfig {
    locateFile?: (file: string) => string
  }

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database
  }

  export default function initSqlJs(config?: InitSqlJsConfig): Promise<SqlJsStatic>
  
  export { Database, Statement, InitSqlJsConfig, SqlJsStatic }
}

