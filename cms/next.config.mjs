import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { withPayload } from '@payloadcms/next/withPayload'
const customDist = process.env.CMS_DIST_DIR
if (customDist && !/^\.next-[a-z0-9-]+$/.test(customDist)) throw new Error('CMS_DIST_DIR doit être un nom local .next- suivi de lettres, chiffres ou tirets.')
export default withPayload({
  poweredByHeader: false,
  distDir: customDist || (process.env.CMS_TEST_DIST === 'production' ? '.next-test-production' : process.env.CMS_TEST_DIST ? '.next-test' : '.next'),
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Cache-Control', value: 'private, no-store' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
    ] }]
  }
})
