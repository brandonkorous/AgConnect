export type Locale = 'en' | 'es';

type ConfirmCopy = {
  subject: string;
  preheader: string;
  greeting: string;
  intro: string;
  about: string;
  cta: string;
  ctaHelp: string;
  expires: string;
  ignore: string;
};

type WelcomeCopy = {
  subject: string;
  preheader: string;
  greeting: string;
  intro: string;
  whatNext: string;
  bullet1: string;
  bullet2: string;
  bullet3: string;
  cta: string;
  signoff: string;
};

type FooterCopy = {
  brandLine: string;
  address: string;
  unsubscribe: string;
  unsubscribeReason: string;
};

export const waitlistStrings: Record<Locale, { confirm: ConfirmCopy; welcome: WelcomeCopy; footer: FooterCopy }> = {
  en: {
    confirm: {
      subject: 'Confirm your spot on the AgConn waitlist',
      preheader: "One quick tap and we'll save your place — we'll text or email when we open in your area.",
      greeting: 'Welcome to AgConn',
      intro: "We saved your spot — but we need to make sure this email is yours. Tap the button below to confirm and we'll keep you in the loop.",
      about: 'AgConn is a bilingual workforce platform connecting Central Valley farmworkers to verified seasonal jobs and CDFA-funded training programs.',
      cta: 'Confirm my email',
      ctaHelp: "If the button doesn't work, copy and paste this link into your browser:",
      expires: 'This link expires in 7 days.',
      ignore: "If you didn't sign up for AgConn, you can ignore this message — we won't add you to anything.",
    },
    welcome: {
      subject: "You're on the AgConn list",
      preheader: "We'll reach out the moment we open in your area — bilingual, no spam.",
      greeting: 'You\'re in.',
      intro: "Thanks for confirming — your spot on the AgConn waitlist is saved. We'll reach out the moment we open in your area.",
      whatNext: "While you wait:",
      bullet1: "We'll send a short note when seasonal jobs open in your county — no more than once a week.",
      bullet2: 'Every message arrives in English and Spanish. Reply STOP at any time to unsubscribe.',
      bullet3: 'Have questions? Reply to this email — a real person reads every reply.',
      cta: 'Visit AgConn',
      signoff: '— The AgConn team',
    },
    footer: {
      brandLine: 'AgConn — From the field, to your future.',
      address: 'AgConn · Central Valley, California',
      unsubscribe: 'Unsubscribe',
      unsubscribeReason: 'You\'re receiving this because you signed up for the AgConn waitlist.',
    },
  },
  es: {
    confirm: {
      subject: 'Confirma tu lugar en la lista de AgConn',
      preheader: 'Un toque y guardamos tu lugar — te avisaremos cuando lleguemos a tu zona.',
      greeting: 'Bienvenido a AgConn',
      intro: 'Te apartamos un lugar — solo necesitamos confirmar que este correo es tuyo. Toca el botón para confirmar y te mantendremos al tanto.',
      about: 'AgConn es una plataforma laboral bilingüe que conecta a trabajadores agrícolas del Valle Central con trabajos de temporada verificados y capacitación financiada por CDFA.',
      cta: 'Confirmar mi correo',
      ctaHelp: 'Si el botón no funciona, copia y pega este enlace en tu navegador:',
      expires: 'Este enlace caduca en 7 días.',
      ignore: 'Si no te registraste en AgConn, puedes ignorar este mensaje — no te agregaremos a nada.',
    },
    welcome: {
      subject: 'Estás en la lista de AgConn',
      preheader: 'Te avisaremos en cuanto lleguemos a tu zona — bilingüe, sin spam.',
      greeting: 'Listo, estás dentro.',
      intro: 'Gracias por confirmar — tu lugar en la lista de AgConn está guardado. Te avisaremos en cuanto lleguemos a tu zona.',
      whatNext: 'Mientras esperas:',
      bullet1: 'Te enviaremos una nota corta cuando se abran trabajos de temporada en tu condado — máximo una vez por semana.',
      bullet2: 'Cada mensaje llega en inglés y español. Responde STOP en cualquier momento para darte de baja.',
      bullet3: '¿Preguntas? Responde este correo — una persona real lee cada respuesta.',
      cta: 'Visitar AgConn',
      signoff: '— El equipo de AgConn',
    },
    footer: {
      brandLine: 'AgConn — Del campo, a tu futuro.',
      address: 'AgConn · Valle Central, California',
      unsubscribe: 'Darme de baja',
      unsubscribeReason: 'Recibes este correo porque te registraste en la lista de AgConn.',
    },
  },
};
