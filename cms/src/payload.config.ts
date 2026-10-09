import { buildConfig } from 'payload'
import { isolatedSQLiteAdapter } from './lib/sqlite-transactions'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fr } from '@payloadcms/translations/languages/fr'
import sharp from 'sharp'
import path from 'node:path'
import { cmsRoot, dataDir, getSecret } from './lib/runtime'
import { Users, Media, contentCollections } from './collections'
import { busyDatabaseResponse, privateAccessEndpoint } from './lib/user-security'

export default buildConfig({
  secret: getSecret(),
  serverURL: process.env.CMS_SERVER_URL || 'http://127.0.0.1:3001',
  csrf: [process.env.CMS_SERVER_URL || 'http://127.0.0.1:3001'],
  cors: [],
  endpoints: [privateAccessEndpoint],
  hooks: { afterError: [busyDatabaseResponse] },
  admin: { timezones: { defaultTimezone: 'Europe/Paris', supportedTimezones: [{ label: 'France (Paris)', value: 'Europe/Paris' }] }, components: { beforeDashboard: ['/components/PublicationStatus#default'] }, user: 'users', importMap: { baseDir: path.join(cmsRoot, 'src') }, meta: { titleSuffix: '— Administration Sant’Innovation' } },
  i18n: { supportedLanguages: { fr }, fallbackLanguage: 'fr' },
  collections: [Users, Media, ...contentCollections],
  editor: lexicalEditor({ features: ({ defaultFeatures }) => defaultFeatures.filter(feature => !['upload', 'relationship'].includes(feature.key)) }),
  email: () => ({
    name: 'email-disabled', defaultFromAddress: 'disabled@example.invalid', defaultFromName: 'CMS local',
    sendEmail: async () => { throw new Error('Envoi courriel désactivé. Demander à un administrateur de réinitialiser le mot de passe. Aucun jeton n’est journalisé.') }
  }),
  db: isolatedSQLiteAdapter({ migrationDir: path.join(cmsRoot, 'src/migrations'), client: { url: `file:${path.join(dataDir, 'cms.sqlite')}` }, wal: { synchronous: 'FULL' }, busyTimeout: 5000, transactionOptions: { behavior: 'immediate' }, push: process.env.NODE_ENV !== 'production' }),
  sharp,
  upload: { limits: { fileSize: 5 * 1024 * 1024 } },
  graphQL: { disable: true },
  telemetry: false,
  typescript: { outputFile: path.join(cmsRoot, 'src/payload-types.ts') }
})
