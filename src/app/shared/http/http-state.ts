export type HttpState<T> =
    | { status: 'loading' }
    | { status: 'success'; data: T[] }
    | { status: 'error'; message: string };