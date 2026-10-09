import { APIError, accessOperation, type AfterErrorHook, type CollectionBeforeOperationHook, type Endpoint } from 'payload'

const disabledMessage = 'La réinitialisation par courriel est désactivée. Contacter un administrateur.'
const privateHeaders = { 'Cache-Control': 'private, no-store' }
/** No lookup, token generation, email transport or different response per user. */
export const disabledPasswordEndpoints: Endpoint[] = ['forgot-password', 'reset-password'].map(path => ({
  path: `/${path}`, method: 'post', handler: async () => Response.json({ message: disabledMessage }, { status: 200, headers: privateHeaders })
}))
export const privateAccessEndpoint: Endpoint = {
  path: '/access', method: 'get', handler: async req => {
    if (!['admin', 'editor'].includes(String(req.user?.role))) return Response.json({ message: 'Authentification requise.' }, { status: 403, headers: privateHeaders })
    return Response.json(await accessOperation({ req }), { headers: privateHeaders })
  }
}

export const busyDatabaseResponse: AfterErrorHook = ({ error }) => {
  if (/SQLITE_(?:BUSY|LOCKED)\b/.test(error.message)) return {
    status: 409,
    response: { errors: [{ message: 'Une autre modification est en cours. Attendre quelques secondes, recharger la fiche puis réessayer. Aucune modification de cette demande n’a été enregistrée.' }] }
  }
}

export const protectUserUpdates: CollectionBeforeOperationHook = async ({ args, operation, req, overrideAccess }) => {
  // This also closes the Local API; the HTTP overrides above intentionally return
  // a neutral answer without entering Payload's native token-issuing operation.
  if (operation === 'forgotPassword' || operation === 'resetPassword') throw new APIError(disabledMessage, 403)
  if (operation !== 'update' || overrideAccess || req.user?.role !== 'editor') return args
  const update = args as { id?: string | number; data: Record<string, unknown> }
  if (String(update.id) !== String(req.user.id)) throw new APIError('Un éditeur peut seulement changer son propre mot de passe.', 403)
  const data = update.data
  if (typeof data.password !== 'string' || data.password.length < 12) throw new APIError('Saisir un nouveau mot de passe d’au moins 12 caractères.', 400)
  const original = await req.payload.findByID({ collection: 'users', id: req.user.id, depth: 0, overrideAccess: true, req }) as unknown as Record<string, unknown>
  // The native account form may resend unchanged identity fields. They are
  // compared before field access strips anything, then discarded completely.
  const unchanged = new Set(['id', 'email', 'nom', 'role', 'createdAt', 'updatedAt'])
  for (const [key, value] of Object.entries(data)) {
    if (key === 'password') continue
    // Payload's native account form sends this confirmation alongside password.
    // It is never a persisted user field and must match before being discarded.
    if (key === 'confirm-password') {
      if (value !== data.password) throw new APIError('La confirmation doit correspondre au nouveau mot de passe.', 400)
      continue
    }
    if (!unchanged.has(key) || JSON.stringify(value) !== JSON.stringify(original[key])) throw new APIError('Seul le mot de passe peut être modifié par un éditeur. Contacter un administrateur pour le compte.', 403)
  }
  update.data = { password: data.password }
  return args
}
