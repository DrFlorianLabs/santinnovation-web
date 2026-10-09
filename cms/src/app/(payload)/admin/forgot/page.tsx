export const dynamic = 'force-dynamic'

export default function PasswordRecoveryDisabled() {
  return <main style={{ maxWidth: '38rem', margin: '4rem auto', padding: '2rem' }}>
    <h1>Mot de passe oublié</h1>
    <p>La récupération par courriel est désactivée. Aucun message de réinitialisation n’est envoyé.</p>
    <p>Contacter un administrateur de Sant’Innovation pour obtenir un nouveau mot de passe. Si vous êtes déjà connecté, vous pouvez changer votre mot de passe depuis votre compte.</p>
    <p><a href="/admin/login">Retour à la connexion</a></p>
  </main>
}
