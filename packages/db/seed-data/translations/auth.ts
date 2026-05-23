// Source of truth for namespace "auth".
// Edit this file to update copy; run `pnpm --filter @agconn/db i18n:seed` to apply.

import type { TranslationBundle } from '../types';

export const auth: TranslationBundle = {
    "shared.back_home": {
        en: "Back to home",
        es: "Volver al inicio",
    },
    "shared.brand": {
        en: "AGCONN",
        es: "AGCONN",
    },
    "shared.errors.generic": {
        en: "Something went wrong. Try again.",
        es: "Algo falló. Inténtalo de nuevo.",
    },
    "shared.errors.invalid_code": {
        en: "That code didn't match. Try again.",
        es: "Ese código no coincide. Inténtalo de nuevo.",
    },
    "shared.errors.invalid_email": {
        en: "Enter a valid email address.",
        es: "Ingresa un correo válido.",
    },
    "shared.errors.invalid_identifier": {
        en: "Enter your phone number or email address.",
        es: "Ingresa tu número de teléfono o tu correo electrónico.",
    },
    "shared.errors.invalid_phone": {
        en: "Enter a 10-digit US phone number.",
        es: "Ingresa un número de 10 dígitos.",
    },
    "shared.errors.no_account": {
        en: "We couldn't find an account with that info.",
        es: "No encontramos una cuenta con esa información.",
    },
    "shared.errors.weak_password": {
        en: "Password must be at least 8 characters.",
        es: "La contraseña debe tener al menos 8 caracteres.",
    },
    "shared.google": {
        en: "Continue with Google",
        es: "Continuar con Google",
    },
    "shared.grant_aligned": {
        en: "CDFA & F3 grant-aligned · Central Valley · 2026",
        es: "Alineado con CDFA y F3 · Valle Central · 2026",
    },
    "shared.or": {
        en: "or",
        es: "o",
    },
    "shared.powered_by": {
        en: "Secured by Clerk",
        es: "Asegurado por Clerk",
    },
    "shared.resend": {
        en: "Send a new code",
        es: "Enviar un código nuevo",
    },
    "shared.resend_in": {
        en: "Resend in {seconds}s",
        es: "Reenviar en {seconds}s",
    },
    "shared.submit": {
        en: "Continue",
        es: "Continuar",
    },
    "shared.submitting": {
        en: "One moment…",
        es: "Un momento…",
    },
    "shared.use_email": {
        en: "Use email instead",
        es: "Usar correo en su lugar",
    },
    "shared.use_phone": {
        en: "Use phone instead",
        es: "Usar teléfono en su lugar",
    },
    "shared.verifying": {
        en: "Verifying…",
        es: "Verificando…",
    },

    // Pitch panel — worker
    "pitch.worker.eyebrow": {
        en: "For workers",
        es: "Para trabajadores",
    },
    "pitch.worker.lead": {
        en: "From the field, to your future.",
        es: "Del campo, a tu futuro.",
    },
    "pitch.worker.proof.p1": {
        en: "Verified seasonal jobs from FLC- and grower-licensed employers",
        es: "Trabajos verificados de empleadores con licencia FLC o de productor",
    },
    "pitch.worker.proof.p2": {
        en: "Bilingual EN/ES from day one — phone calls, texts, training, all of it",
        es: "Bilingüe EN/ES desde el primer día — llamadas, mensajes, capacitaciones, todo",
    },
    "pitch.worker.proof.p3": {
        en: "CDFA-funded training programs and a portable skills wallet that travels with you",
        es: "Capacitaciones financiadas por CDFA y un portafolio de habilidades que viaja contigo",
    },

    // Pitch panel — employer
    "pitch.employer.eyebrow": {
        en: "For employers",
        es: "Para empleadores",
    },
    "pitch.employer.stat_unit": {
        en: "verified employers",
        es: "empleadores verificados",
    },
    "pitch.employer.lead": {
        en: "Hire your next crew, faster.",
        es: "Contrata tu próxima cuadrilla, rápido.",
    },
    "pitch.employer.proof.p1": {
        en: "FLC license verification + Cal/OSHA compliance binder, audit-ready",
        es: "Verificación de licencia FLC + carpeta de cumplimiento Cal/OSHA, lista para auditoría",
    },
    "pitch.employer.proof.p2": {
        en: "Worker search, broadcasts, SMS + in-app messaging",
        es: "Búsqueda de trabajadores, transmisiones, mensajería SMS + en-app",
    },
    "pitch.employer.proof.p3": {
        en: "Auto payroll calc with AB 1513 piece-rate breaks + AEWR for H-2A",
        es: "Cálculo de nómina con descansos pagados a destajo (AB 1513) y AEWR para H-2A",
    },

    // Pitch panel — sign-in
    "pitch.sign_in.eyebrow": {
        en: "Welcome back",
        es: "Bienvenido de vuelta",
    },
    "pitch.sign_in.lead": {
        en: "From the field, to your future.",
        es: "Del campo, a tu futuro.",
    },
    "pitch.sign_in.proof.p1": {
        en: "Workers: pick up where you left off — applications, training, pay history",
        es: "Trabajadores: continúa donde te quedaste — postulaciones, capacitaciones, historial de pagos",
    },
    "pitch.sign_in.proof.p2": {
        en: "Employers: jump back into your inbox, schedule, payroll, and compliance",
        es: "Empleadores: vuelve a tu bandeja, horario, nómina y cumplimiento",
    },
    "pitch.sign_in.proof.p3": {
        en: "Use phone or email — whichever is on your account",
        es: "Usa teléfono o correo — el que tengas en tu cuenta",
    },

    // Sign-in (unified, phone or email auto-detect)
    "sign_in.meta_title": {
        en: "Sign in to AGCONN",
        es: "Inicia sesión en AGCONN",
    },
    "sign_in.eyebrow": {
        en: "Welcome back",
        es: "Bienvenido de vuelta",
    },
    "sign_in.title_a": {
        en: "Sign in to",
        es: "Inicia sesión en",
    },
    "sign_in.subtitle": {
        en: "Use your phone or email — whichever is on your account.",
        es: "Usa tu teléfono o correo — el que tengas en tu cuenta.",
    },
    "sign_in.identifier_label": {
        en: "Phone or email",
        es: "Teléfono o correo",
    },
    "sign_in.identifier_placeholder": {
        en: "(555) 123-4567 or you@example.com",
        es: "(555) 123-4567 o tu@ejemplo.com",
    },
    "sign_in.identifier_help": {
        en: "We'll auto-detect and either text you a code or ask for your password.",
        es: "Detectamos automáticamente y te enviamos un código por SMS o pedimos tu contraseña.",
    },
    "sign_in.password_label": {
        en: "Password",
        es: "Contraseña",
    },
    "sign_in.password_placeholder": {
        en: "Your password",
        es: "Tu contraseña",
    },
    "sign_in.password_subtitle": {
        en: "Enter your password for {target}.",
        es: "Ingresa tu contraseña para {target}.",
    },
    "sign_in.verify_subtitle": {
        en: "We sent a 6-digit code to {target}.",
        es: "Enviamos un código de 6 dígitos a {target}.",
    },
    "sign_in.code_label": {
        en: "6-digit code",
        es: "Código de 6 dígitos",
    },
    "sign_in.back_to_identifier": {
        en: "Use a different account",
        es: "Usar otra cuenta",
    },
    "sign_in.no_account": {
        en: "New here?",
        es: "¿Nuevo aquí?",
    },
    "sign_in.sign_up_worker": {
        en: "Sign up as a worker",
        es: "Crear cuenta como trabajador",
    },
    "sign_in.sign_up_employer": {
        en: "I'm an employer →",
        es: "Soy empleador →",
    },

    // Worker sign-up (phone OR email)
    "sign_up_worker.meta_title": {
        en: "Sign up — Workers · AGCONN",
        es: "Crear cuenta — Trabajadores · AGCONN",
    },
    "sign_up_worker.eyebrow": {
        en: "Worker sign-up",
        es: "Registro de trabajador",
    },
    "sign_up_worker.title_a": {
        en: "Find seasonal",
        es: "Encuentra trabajo",
    },
    "sign_up_worker.title_b": {
        en: "work today.",
        es: "de temporada hoy.",
    },
    "sign_up_worker.subtitle": {
        en: "Phone OR email — whichever you prefer. Free, takes a minute.",
        es: "Teléfono O correo — lo que prefieras. Gratis, te toma un minuto.",
    },
    "sign_up_worker.first_name_label": {
        en: "First name",
        es: "Nombre",
    },
    "sign_up_worker.first_name_placeholder": {
        en: "María",
        es: "María",
    },
    "sign_up_worker.last_name_label": {
        en: "Last name",
        es: "Apellido",
    },
    "sign_up_worker.last_name_placeholder": {
        en: "Hernández",
        es: "Hernández",
    },
    "sign_up_worker.identifier_label": {
        en: "Phone or email",
        es: "Teléfono o correo",
    },
    "sign_up_worker.identifier_placeholder": {
        en: "(555) 123-4567 or you@example.com",
        es: "(555) 123-4567 o tu@ejemplo.com",
    },
    "sign_up_worker.identifier_help": {
        en: "Phone gets a 6-digit SMS code. Email gets a code after you set a password.",
        es: "Por teléfono recibes un código de 6 dígitos por SMS. Por correo, después de elegir contraseña.",
    },
    "sign_up_worker.phone_label": {
        en: "Mobile number",
        es: "Número de celular",
    },
    "sign_up_worker.phone_placeholder": {
        en: "(555) 123-4567",
        es: "(555) 123-4567",
    },
    "sign_up_worker.phone_help": {
        en: "We'll text a 6-digit code to verify. No spam, ever.",
        es: "Te enviamos un código de 6 dígitos por SMS. Sin spam, nunca.",
    },
    "sign_up_worker.email_label": {
        en: "Email address",
        es: "Correo electrónico",
    },
    "sign_up_worker.email_placeholder": {
        en: "you@example.com",
        es: "tu@ejemplo.com",
    },
    "sign_up_worker.password_label": {
        en: "Choose a password",
        es: "Elige una contraseña",
    },
    "sign_up_worker.password_help": {
        en: "At least 8 characters.",
        es: "Al menos 8 caracteres.",
    },
    "sign_up_worker.password_subtitle": {
        en: "Choose a password for {target}. We'll then email a 6-digit code to verify.",
        es: "Elige una contraseña para {target}. Después enviaremos un código de 6 dígitos al correo.",
    },
    "sign_up_worker.verify_phone_subtitle": {
        en: "We sent a 6-digit code to {target}.",
        es: "Enviamos un código de 6 dígitos a {target}.",
    },
    "sign_up_worker.verify_email_subtitle": {
        en: "We sent a 6-digit code to {target}.",
        es: "Enviamos un código de 6 dígitos a {target}.",
    },
    "sign_up_worker.code_label": {
        en: "6-digit code",
        es: "Código de 6 dígitos",
    },
    "sign_up_worker.have_account": {
        en: "Already have an account?",
        es: "¿Ya tienes cuenta?",
    },
    "sign_up_worker.sign_in_link": {
        en: "Sign in",
        es: "Inicia sesión",
    },
    "sign_up_worker.terms_prefix": {
        en: "By continuing you agree to our",
        es: "Al continuar aceptas nuestros",
    },
    "sign_up_worker.terms_link": {
        en: "Terms",
        es: "Términos",
    },
    "sign_up_worker.and": {
        en: "and",
        es: "y",
    },
    "sign_up_worker.privacy_link": {
        en: "Privacy policy",
        es: "Política de privacidad",
    },
    "sign_up_worker.california_notice_prefix": {
        en: "California residents:",
        es: "Residentes de California:",
    },
    "sign_up_worker.california_notice_link": {
        en: "see our Notice at Collection",
        es: "consulta nuestro Aviso al momento de la recopilación",
    },
    "sign_up_worker.hire_instead": {
        en: "Hiring crews?",
        es: "¿Contratando cuadrillas?",
    },
    "sign_up_worker.employer_link": {
        en: "Sign up as an employer →",
        es: "Crear cuenta como empleador →",
    },

    // Employer sign-up (email required, phone optional)
    "sign_up_employer.meta_title": {
        en: "Sign up — Employers · AGCONN",
        es: "Crear cuenta — Empleadores · AGCONN",
    },
    "sign_up_employer.eyebrow": {
        en: "Employer sign-up",
        es: "Registro de empleador",
    },
    "sign_up_employer.title_a": {
        en: "Hire your",
        es: "Contrata tu",
    },
    "sign_up_employer.title_b": {
        en: "next crew.",
        es: "próxima cuadrilla.",
    },
    "sign_up_employer.subtitle": {
        en: "Email is required — that's how we send compliance notices and receipts. Add a phone for faster sign-ins.",
        es: "El correo es obligatorio — así enviamos avisos de cumplimiento y recibos. Agrega un teléfono para iniciar sesión más rápido.",
    },
    "sign_up_employer.first_name_label": {
        en: "First name",
        es: "Nombre",
    },
    "sign_up_employer.first_name_placeholder": {
        en: "Elena",
        es: "Elena",
    },
    "sign_up_employer.last_name_label": {
        en: "Last name",
        es: "Apellido",
    },
    "sign_up_employer.last_name_placeholder": {
        en: "Sanchez",
        es: "Sánchez",
    },
    "sign_up_employer.identifier_label": {
        en: "Phone or email",
        es: "Teléfono o correo",
    },
    "sign_up_employer.identifier_placeholder": {
        en: "(555) 123-4567 or you@yourfarm.com",
        es: "(555) 123-4567 o tu@tugranja.com",
    },
    "sign_up_employer.identifier_help": {
        en: "Phone gets a 6-digit SMS code. Email gets a code after you set a password.",
        es: "Por teléfono recibes un código de 6 dígitos por SMS. Por correo, después de elegir contraseña.",
    },
    "sign_up_employer.password_label": {
        en: "Choose a password",
        es: "Elige una contraseña",
    },
    "sign_up_employer.password_help": {
        en: "At least 8 characters.",
        es: "Al menos 8 caracteres.",
    },
    "sign_up_employer.password_subtitle": {
        en: "Choose a password for {target}. We'll then email a 6-digit code to verify.",
        es: "Elige una contraseña para {target}. Después enviaremos un código de 6 dígitos al correo.",
    },
    "sign_up_employer.verify_phone_subtitle": {
        en: "We sent a 6-digit code to {target}.",
        es: "Enviamos un código de 6 dígitos a {target}.",
    },
    "sign_up_employer.verify_email_subtitle": {
        en: "We sent a 6-digit code to {target}.",
        es: "Enviamos un código de 6 dígitos a {target}.",
    },
    "sign_up_employer.code_label": {
        en: "6-digit code",
        es: "Código de 6 dígitos",
    },
    "sign_up_employer.have_account": {
        en: "Already have an account?",
        es: "¿Ya tienes cuenta?",
    },
    "sign_up_employer.sign_in_link": {
        en: "Sign in",
        es: "Inicia sesión",
    },
    "sign_up_employer.worker_instead": {
        en: "← Looking for work?",
        es: "← ¿Buscando trabajo?",
    },
    "sign_up_employer.terms_prefix": {
        en: "By continuing you agree to our",
        es: "Al continuar aceptas nuestros",
    },
    "sign_up_employer.terms_link": {
        en: "Terms",
        es: "Términos",
    },
    "sign_up_employer.and": {
        en: "and",
        es: "y",
    },
    "sign_up_employer.privacy_link": {
        en: "Privacy policy",
        es: "Política de privacidad",
    },
    "sign_up_employer.california_notice_prefix": {
        en: "California residents:",
        es: "Residentes de California:",
    },
    "sign_up_employer.california_notice_link": {
        en: "see our Notice at Collection",
        es: "consulta nuestro Aviso al momento de la recopilación",
    },
};
