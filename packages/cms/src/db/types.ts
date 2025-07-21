type VariableArgFunction = (...params: unknown[]) => unknown;
type ArgumentTypes<F extends VariableArgFunction> = F extends (...args: infer A) => unknown
    ? A
    : never;
type ElementOf<T> = T extends Array<infer E> ? E : T;

export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
}

export interface PragmaOptions {
    simple?: boolean | undefined;
}

export interface Statement<BindParameters extends unknown[], Result = unknown> {
    database: Database;
    source: string;
    reader: boolean;
    readonly: boolean;
    busy: boolean;

    run(...params: BindParameters): RunResult;
    get(...params: BindParameters): Result | undefined;
    all(...params: BindParameters): Result[];
    iterate(...params: BindParameters): IterableIterator<Result>;
    pluck(toggleState?: boolean): this;
    expand(toggleState?: boolean): this;
    raw(toggleState?: boolean): this;
    bind(...params: BindParameters): this;
    columns(): ColumnDefinition[];
    safeIntegers(toggleState?: boolean): this;
}

export interface ColumnDefinition {
    name: string;
    column: string | null;
    table: string | null;
    database: string | null;
    type: string | null;
}

export interface Transaction<F extends VariableArgFunction> {
    (...params: ArgumentTypes<F>): ReturnType<F>;
    default(...params: ArgumentTypes<F>): ReturnType<F>;
    deferred(...params: ArgumentTypes<F>): ReturnType<F>;
    immediate(...params: ArgumentTypes<F>): ReturnType<F>;
    exclusive(...params: ArgumentTypes<F>): ReturnType<F>;
}

export interface VirtualTableOptions {
    rows: (...params: unknown[]) => Generator;
    columns: string[];
    parameters?: string[] | undefined;
    safeIntegers?: boolean | undefined;
    directOnly?: boolean | undefined;
}

export interface RegistrationOptions {
    varargs?: boolean | undefined;
    deterministic?: boolean | undefined;
    safeIntegers?: boolean | undefined;
    directOnly?: boolean | undefined;
}

export interface BackupOptions {
    progress: (info: BackupMetadata) => number;
}

export interface BackupMetadata {
    totalPages: number;
    remainingPages: number;
}

export interface SerializeOptions {
    attached?: string;
}

export interface Database {
    memory: boolean;
    readonly: boolean;
    name: string;
    open: boolean;
    inTransaction: boolean;

    prepare<BindParameters extends unknown[] | (object & {}) = unknown[], Result = unknown>(
        source: string,
    ): BindParameters extends unknown[]
        ? Statement<BindParameters, Result>
        : Statement<[BindParameters], Result>;
    transaction<F extends VariableArgFunction>(fn: F): Transaction<F>;
    exec(source: string): this;
    pragma(source: string, options?: PragmaOptions): unknown;
    function(name: string, cb: (...params: unknown[]) => unknown): this;
    function(
        name: string,
        options: RegistrationOptions,
        cb: (...params: unknown[]) => unknown,
    ): this;
    aggregate<T>(
        name: string,
        options: RegistrationOptions & {
            start?: T | (() => T);

            step: (total: T, next: ElementOf<T>) => T | void;
            inverse?: ((total: T, dropped: T) => T) | undefined;
            result?: ((total: T) => unknown) | undefined;
        },
    ): this;
    loadExtension(path: string): this;
    close(): this;
    defaultSafeIntegers(toggleState?: boolean): this;
    backup(destinationFile: string, options?: BackupOptions): Promise<BackupMetadata>;
    table(name: string, options: VirtualTableOptions): this;
    unsafeMode(unsafe?: boolean): this;
    serialize(options?: SerializeOptions): Buffer;
}
