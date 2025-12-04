declare module 'y-indexeddb' {
    import * as Y from 'yjs'
    import { Observable } from 'lib0/observable'

    export class IndexeddbPersistence extends Observable<string> {
        constructor(name: string, doc: Y.Doc)
        destroy(): Promise<void>
        clearData(): Promise<void>
    }
}
