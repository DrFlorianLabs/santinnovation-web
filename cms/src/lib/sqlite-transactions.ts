import { randomUUID } from 'node:crypto'
import { createClient } from '@libsql/client'
import { sqliteAdapter, type SQLiteAdapterArgs } from '@payloadcms/db-sqlite'
import { drizzle } from 'drizzle-orm/libsql'
import { APIError } from 'payload'

/**
 * Payload 3.90.2's callback/promise bridge can swallow a failed COMMIT. The
 * libsql 0.14 shared client can also retain a failed BEGIN statement and poison
 * its next transaction (libsql-client-ts#352). A transaction therefore owns a
 * fresh connection from BEGIN IMMEDIATE through COMMIT/ROLLBACK and close.
 *
 * No retries, no replay of hooks and no modification of installed packages.
 * The Payload adapter factory and sessions map are the integration boundary:
 * recheck these pinned adapter APIs, migrations and nested operations on upgrade.
 */
export function isolatedSQLiteAdapter(args: SQLiteAdapterArgs) {
  if (!args.transactionOptions || !args.client.url.startsWith('file:')) throw new Error('Le CMS exige des transactions SQLite locales actives.')
  const base = sqliteAdapter(args)
  return {
    ...base,
    init(initArgs: Parameters<typeof base.init>[0]) {
      const adapter = base.init(initArgs)
      adapter.beginTransaction = async function () {
        await this.initializing
        const client = createClient(this.clientConfig)
        try {
          await client.execute(`PRAGMA busy_timeout = ${this.busyTimeout}`)
          await client.execute('PRAGMA foreign_keys = ON')
          await client.execute('PRAGMA synchronous = FULL')
          // executeMultiple rolls back any transaction left open on return, so
          // use execute only for BEGIN. A failed BEGIN closes this client.
          await client.execute('BEGIN IMMEDIATE')
          const id = randomUUID()
          const db = drizzle(client, { logger: this.logger || false, schema: this.schema })
          this.sessions[id] = {
            // Payload CRUD uses the Drizzle query API here. Nested Payload
            // operations reuse req.transactionID, never start a second BEGIN.
            db: db as unknown as (typeof this.sessions)[string]['db'],
            resolve: async () => {
              try { await client.executeMultiple('COMMIT') }
              finally { client.close() }
            },
            reject: async () => {
              try { await client.executeMultiple('ROLLBACK') }
              finally { client.close() }
            }
          }
          return id
        } catch (error) {
          client.close()
          throw error
        }
      }
      adapter.commitTransaction = async function (incomingID) {
        const id = await incomingID
        if (!id) return
        const session = this.sessions[id]
        if (!session) throw new APIError('La transaction a été annulée. Recharger la fiche puis réessayer.', 409)
        delete this.sessions[id]
        // executeMultiple uses native exec, rolls back if COMMIT fails, and
        // propagates its error. Never turn a rollback into a success response.
        await session.resolve()
      }
      adapter.rollbackTransaction = async function (incomingID) {
        const id = await incomingID
        if (!id || !this.sessions[id]) return
        const session = this.sessions[id]
        delete this.sessions[id]
        await session.reject()
      }
      return adapter
    }
  }
}
