export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

type GTagEvent = {
  action: string
  category: string
  label?: string
  value?: number
}

function gtagEvent({ action, category, label, value }: GTagEvent) {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  })
}

// Named conversion events used across the app
export const track = {
  login:          ()          => gtagEvent({ action: 'login',          category: 'Auth',     label: 'clinician_sign_in' }),
  signupComplete: ()          => gtagEvent({ action: 'sign_up',        category: 'Auth',     label: 'clinician_registration' }),
  passwordReset:  ()          => gtagEvent({ action: 'password_reset', category: 'Auth',     label: 'reset_requested' }),
  mfaComplete:    ()          => gtagEvent({ action: 'mfa_verified',   category: 'Auth',     label: 'mfa_success' }),
  sosTriggered:   ()          => gtagEvent({ action: 'sos_trigger',    category: 'Clinical', label: 'sos_alert_sent' }),
  patientViewed:  (id: string)=> gtagEvent({ action: 'view_patient',   category: 'Clinical', label: id }),
}
