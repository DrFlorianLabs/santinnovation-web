import assert from 'node:assert/strict'
import { createLocalReq, type Payload } from 'payload'
import type { Client } from '@libsql/client'

export async function transactionRegression(payload: Payload, admin: any, ok: (s: string) => void) {
  const adapter = payload.db as any
  const item = await payload.create({ collection: 'actualites', user: admin, overrideAccess: false, data: { slug: 'transaction-fictive', titre: 'Avant transaction', resume: 'Contenu synthétique', categorie: 'Actualité', date: '2026-10-09T00:00:00Z', _status: 'published' } })
  const read = () => payload.findByID({ collection: 'actualites', id: item.id, user: admin, overrideAccess: false, draft: false })
  const update = (titre: string, req?: any) => payload.update({ collection: 'actualites', id: item.id, user: admin, overrideAccess: false, req, data: { titre, _status: 'published' } })
  const firstID = await adapter.beginTransaction()
  const firstClient = adapter.sessions[firstID].db.$client as Client
  try {
    for (const [pragma, column, expected] of [['journal_mode', 'journal_mode', 'wal'], ['synchronous', 'synchronous', 2], ['busy_timeout', 'timeout', 5000], ['foreign_keys', 'foreign_keys', 1]] as const) {
      assert.equal((await firstClient.execute(`PRAGMA ${pragma}`)).rows[0][column], expected)
    }
    const req = await createLocalReq({ user: admin, req: { transactionID: firstID } }, payload)
    await update('Première transaction', req)
    assert.equal(req.transactionID, firstID, 'Les opérations imbriquées doivent conserver la transaction')
    assert.equal((await read()).titre, 'Avant transaction', 'Une écriture non commitée doit rester invisible hors transaction')
    await assert.rejects(() => adapter.beginTransaction(), /SQLITE_BUSY/)
    await adapter.commitTransaction(Promise.resolve(firstID))
    assert.equal(firstClient.closed, true)
  } finally { await adapter.rollbackTransaction(firstID) }
  assert.equal((await read()).titre, 'Première transaction')
  const nextID = await adapter.beginTransaction()
  const nextClient = adapter.sessions[nextID].db.$client as Client
  try {
    await update('Transaction suivante', await createLocalReq({ user: admin, req: { transactionID: nextID } }, payload))
    await adapter.commitTransaction(Promise.resolve(nextID))
  } finally { await adapter.rollbackTransaction(nextID) }
  assert.equal(nextClient.closed, true)
  assert.equal((await read()).titre, 'Transaction suivante', 'Après un BEGIN refusé, le COMMIT suivant doit persister réellement')
  ok('SQLite — contention déterministe puis écriture suivante persistée; connexions isolées fermées, PRAGMA appliqués et opérations imbriquées atomiques')

  // Real deferred FK failure at COMMIT, after the document and version writes.
  // The hook and its test-only tables exist exclusively in this isolated DB.
  const config = payload.collections.actualites.config
  const hooks = config.hooks.beforeChange
  let failedClient: Client | undefined
  const versionsBefore = (await payload.findVersions({ collection: 'actualites', overrideAccess: true, where: { parent: { equals: item.id } } })).totalDocs
  config.hooks.beforeChange = [...hooks, async ({ req, data }) => {
    if (req.context.syntheticCommitFailure) {
      failedClient = adapter.sessions[String(await req.transactionID)].db.$client as Client
      await failedClient.execute('CREATE TABLE test_commit_parent (id INTEGER PRIMARY KEY)')
      await failedClient.execute('CREATE TABLE test_commit_child (parent_id INTEGER REFERENCES test_commit_parent(id) DEFERRABLE INITIALLY DEFERRED)')
      await failedClient.execute('INSERT INTO test_commit_child(parent_id) VALUES (1)')
    }
    return data
  }]
  try {
    await assert.rejects(() => payload.update({ collection: 'actualites', id: item.id, user: admin, overrideAccess: false, context: { syntheticCommitFailure: true }, data: { titre: 'Ne doit jamais être enregistré', _status: 'published' } }), /FOREIGN KEY constraint failed/)
  } finally { config.hooks.beforeChange = hooks }
  assert.equal(failedClient?.closed, true)
  assert.equal((await read()).titre, 'Transaction suivante')
  assert.equal((await payload.findVersions({ collection: 'actualites', overrideAccess: true, where: { parent: { equals: item.id } } })).totalDocs, versionsBefore)
  assert.equal((await adapter.client.execute("SELECT name FROM sqlite_master WHERE name IN ('test_commit_parent','test_commit_child')")).rows.length, 0)
  assert.equal(Object.keys(adapter.sessions).length, 0)
  await update('Écriture après refus du COMMIT')
  assert.equal((await read()).titre, 'Écriture après refus du COMMIT')
  await payload.update({ collection: 'actualites', id: item.id, user: admin, overrideAccess: false, data: { _status: 'draft' } })
  ok('SQLite — échec réel COMMIT propagé, document/versions/DDL annulés ensemble, connexion fermée et écriture suivante possible')
}
