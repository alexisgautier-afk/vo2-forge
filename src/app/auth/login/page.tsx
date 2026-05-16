'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  return (
    <div className="min-h-screen bg-blue-deep flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 px-12 py-14 border-r border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <span className="text-white font-jost font-bold text-xl tracking-tight">VO2</span>
            <span className="text-white/30 text-lg">|</span>
            <span className="text-white/60 font-dm-sans text-lg">Forge</span>
          </div>

          <h2 className="text-white font-jost font-bold text-3xl leading-tight mb-4">
            Your AI engineering<br />crew, on demand.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Coding, QA, PM and Specs agents — all working on the SMCP clienteling project.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Coding', desc: 'Opens PRs, never merges' },
            { label: 'QA', desc: 'Reviews & comments PRs' },
            { label: 'PM', desc: 'Breaks down tickets' },
            { label: 'Specs', desc: 'Writes technical specs' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-blue-vo2 flex-shrink-0" />
              <span className="text-white/80 text-sm font-medium w-12">{label}</span>
              <span className="text-white/40 text-sm">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <span className="text-white font-jost font-bold text-xl">VO2</span>
            <span className="text-white/30 text-lg">|</span>
            <span className="text-white/60 font-dm-sans text-lg">Forge</span>
          </div>

          <p className="label-mono mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Accès équipe</p>
          <h1 className="text-white font-jost font-bold text-2xl mb-8">Connexion</h1>

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4C6EF5',
                    brandAccent: '#3B5BDB',
                    brandButtonText: 'white',
                    defaultButtonBackground: 'rgba(255,255,255,0.07)',
                    defaultButtonBackgroundHover: 'rgba(255,255,255,0.12)',
                    defaultButtonBorder: 'rgba(255,255,255,0.12)',
                    defaultButtonText: 'rgba(255,255,255,0.9)',
                    dividerBackground: 'rgba(255,255,255,0.1)',
                    inputBackground: 'rgba(255,255,255,0.06)',
                    inputBorder: 'rgba(255,255,255,0.12)',
                    inputBorderHover: 'rgba(255,255,255,0.25)',
                    inputBorderFocus: '#4C6EF5',
                    inputText: 'white',
                    inputLabelText: 'rgba(255,255,255,0.6)',
                    inputPlaceholder: 'rgba(255,255,255,0.25)',
                    messageText: 'rgba(255,255,255,0.7)',
                    messageTextDanger: '#FCA5A5',
                    anchorTextColor: '#93C5FD',
                    anchorTextHoverColor: 'white',
                  },
                  borderWidths: { buttonBorderWidth: '1px', inputBorderWidth: '1px' },
                  radii: { borderRadiusButton: '8px', inputBorderRadius: '8px' },
                  fontSizes: { baseBodySize: '14px', baseInputSize: '14px' },
                  fonts: { bodyFontFamily: 'DM Sans, sans-serif', inputFontFamily: 'DM Sans, sans-serif', buttonFontFamily: 'DM Sans, sans-serif' },
                },
              },
            }}
            providers={[]}
            redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Mot de passe',
                  button_label: 'Se connecter',
                  loading_button_label: 'Connexion en cours…',
                  link_text: 'Déjà un compte ? Se connecter',
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Mot de passe',
                  button_label: 'Créer un compte',
                  loading_button_label: 'Création en cours…',
                  link_text: 'Pas encore de compte ? S\'inscrire',
                },
                forgotten_password: {
                  email_label: 'Email',
                  button_label: 'Envoyer le lien',
                  link_text: 'Mot de passe oublié ?',
                  loading_button_label: 'Envoi en cours…',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
