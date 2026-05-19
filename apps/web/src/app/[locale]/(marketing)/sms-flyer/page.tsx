import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import { inboundOptInKeyword, inboundPhoneDisplay } from '@agconn/sms/inbound-number';

type Locale = 'en' | 'es';
type RouteProps = { params: Promise<{ locale: Locale }> };

export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale } = await params;
  const title =
    locale === 'es'
      ? 'Volante de inscripción por SMS — AGCONN'
      : 'SMS opt-in flyer — AGCONN';
  const description =
    locale === 'es'
      ? 'Volante imprimible de doble opt-in por SMS de AGCONN. Para distribución en ferias de empleo y por organizaciones aliadas.'
      : 'AGCONN printable SMS double opt-in flyer. For distribution at job fairs and through partner organizations.';
  return {
    title,
    description,
    alternates: { canonical: `/${locale}/sms-flyer` },
    robots: { index: false, follow: false },
  };
}

export default async function SmsFlyerPage({ params }: RouteProps) {
  const { locale } = await params;
  const phone = inboundPhoneDisplay();
  const keywordEn = inboundOptInKeyword('en');
  const keywordEs = inboundOptInKeyword('es');
  const docId = buildDocId(new Date());

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <Breadcrumb locale={locale} path="/sms-flyer" />
      <div className="bg-white text-black min-h-screen">
        <div className="screen-only mx-auto flex max-w-[7in] items-center justify-between px-6 pb-4 pt-6">
          <a
            href={`/${locale}`}
            className="text-base-content/60 hover:text-base-content text-sm"
          >
            ← AGCONN
          </a>
          <PrintHint />
        </div>

        <article className="doc-binder mx-auto max-w-[7in] px-[0.5in] pb-[0.5in] pt-[0.5in] print:max-w-none print:px-0 print:pt-0 print:pb-0">
          <Letterhead docId={docId} />

          <FlyerSide
            heading="AGCONN SMS job alerts"
            subheading="Free, bilingual job alerts — text us to enroll."
            programLabel="Program"
            program="AGCONN — California Central Valley farmworker job alerts"
            howLabel="How to enroll"
            howSteps={[
              `Text the keyword ${keywordEn} (English) or ${keywordEs} (Spanish) to ${phone} from your mobile phone.`,
              `AGCONN replies asking you to confirm. Reply YES to complete enrollment.`,
              `You can also enroll on the web: agconn.com/en/sms-consent`,
            ]}
            messagesLabel="What you receive"
            messages="New verified job postings in your area, application status, training reminders, certificate notifications, and account verification codes. Marketing or promotional content is never sent on this channel."
            frequencyLabel="Message frequency"
            frequency="Up to 30 messages per phone per month under normal use; most workers receive five or fewer per month. No messages are sent between 9 PM and 7 AM Pacific time."
            ratesLabel="Standard rates"
            rates="Message and data rates may apply per your mobile carrier plan."
            helpLabel="Help and stop"
            help={`Reply HELP to any AGCONN message for help, or text the same to ${phone}. Reply STOP at any time to immediately stop all SMS to your number.`}
            privacyLabel="Privacy and terms"
            privacy="AGCONN never sells, rents, trades, or shares your phone number for marketing or any other purpose. Full SMS terms: agconn.com/en/sms-consent. Privacy policy: agconn.com/en/privacy. Terms of service: agconn.com/en/terms."
            consentLine="I agree to receive transactional SMS messages from AGCONN as described above. I understand consent is not required to use AGCONN and that I can stop messages at any time by replying STOP."
            phoneLabel="Mobile phone number"
            nameLabel="Printed name"
            signatureLabel="Signature"
            dateLabel="Date"
            staffLabel="For office use only — completed on"
            byStaffLabel="by staff member"
          />

          <Divider label="Versión en español" />

          <FlyerSide
            heading="Alertas de empleo por SMS de AGCONN"
            subheading="Alertas de empleo gratis y bilingües — envíanos un mensaje para inscribirte."
            programLabel="Programa"
            program="AGCONN — Alertas de empleo para trabajadores agrícolas del Valle Central de California"
            howLabel="Cómo inscribirte"
            howSteps={[
              `Envía la palabra ${keywordEs} (español) o ${keywordEn} (inglés) al ${phone} desde tu teléfono móvil.`,
              `AGCONN responderá pidiéndote que confirmes. Responde SÍ para completar la inscripción.`,
              `También puedes inscribirte en la web: agconn.com/es/sms-consent`,
            ]}
            messagesLabel="Qué recibirás"
            messages="Nuevas ofertas de empleo verificadas en tu área, estado de solicitudes, recordatorios de capacitación, notificaciones de certificados y códigos de verificación de cuenta. Nunca se envía contenido de marketing o promocional por este canal."
            frequencyLabel="Frecuencia de mensajes"
            frequency="Hasta 30 mensajes por teléfono al mes bajo uso normal; la mayoría de trabajadores reciben cinco o menos al mes. No se envían mensajes entre las 9 PM y las 7 AM hora del Pacífico."
            ratesLabel="Tarifas estándar"
            rates="Las tarifas de mensajes y datos pueden aplicar según tu plan de operador móvil."
            helpLabel="Ayuda y cancelación"
            help={`Responde AYUDA a cualquier mensaje de AGCONN para obtener ayuda, o envía AYUDA al ${phone}. Responde STOP en cualquier momento para detener inmediatamente todos los SMS a tu número.`}
            privacyLabel="Privacidad y términos"
            privacy="AGCONN nunca vende, alquila, intercambia ni comparte tu número de teléfono para marketing ni para ningún otro propósito. Términos completos de SMS: agconn.com/es/sms-consent. Política de privacidad: agconn.com/es/privacy. Términos de servicio: agconn.com/es/terms."
            consentLine="Acepto recibir mensajes SMS transaccionales de AGCONN como se describe arriba. Entiendo que el consentimiento no es requerido para usar AGCONN y que puedo detener los mensajes en cualquier momento respondiendo STOP."
            phoneLabel="Número de teléfono móvil"
            nameLabel="Nombre en letra de molde"
            signatureLabel="Firma"
            dateLabel="Fecha"
            staffLabel="Solo para uso de oficina — completado el"
            byStaffLabel="por miembro del personal"
          />

          <footer className="meta mt-8 border-t border-black pt-3 text-center">
            DOC {docId} &middot; AGCONN, Visalia, California &middot; agconn.com/en/sms-consent
          </footer>
        </article>
      </div>
    </>
  );
}

function Letterhead({ docId }: { docId: string }) {
  return (
    <header>
      <div className="flex items-end justify-between border-b border-black pb-3">
        <span className="font-serif text-[26pt] font-semibold leading-none tracking-tight text-black">
          AG<span className="text-black/50">CONN</span>
        </span>
        <span className="meta text-right">
          <span className="block">SMS COMPLIANCE</span>
          <span className="block">DOC {docId}</span>
        </span>
      </div>
      <h1 className="mt-5 text-[20pt] font-semibold leading-tight">
        SMS opt-in / Inscripción por SMS
      </h1>
      <div className="meta mt-1">
        Bilingual paper opt-in form &middot; Formulario bilingüe de inscripción en papel
      </div>
    </header>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="mt-10 border-t border-black pt-3">
      <div className="meta">{label}</div>
    </div>
  );
}

type FlyerProps = {
  heading: string;
  subheading: string;
  programLabel: string;
  program: string;
  howLabel: string;
  howSteps: string[];
  messagesLabel: string;
  messages: string;
  frequencyLabel: string;
  frequency: string;
  ratesLabel: string;
  rates: string;
  helpLabel: string;
  help: string;
  privacyLabel: string;
  privacy: string;
  consentLine: string;
  phoneLabel: string;
  nameLabel: string;
  signatureLabel: string;
  dateLabel: string;
  staffLabel: string;
  byStaffLabel: string;
};

function FlyerSide(p: FlyerProps) {
  return (
    <section className="mt-6">
      <h2 className="text-[14pt] font-semibold">{p.heading}</h2>
      <div className="meta mt-1">{p.subheading}</div>

      <Block label={p.programLabel}>{p.program}</Block>

      <Block label={p.howLabel}>
        <ol className="list-decimal pl-5">
          {p.howSteps.map((s) => (
            <li key={s} className="mt-1">{s}</li>
          ))}
        </ol>
      </Block>

      <Block label={p.messagesLabel}>{p.messages}</Block>
      <Block label={p.frequencyLabel}>{p.frequency}</Block>
      <Block label={p.ratesLabel}>{p.rates}</Block>
      <Block label={p.helpLabel}>{p.help}</Block>
      <Block label={p.privacyLabel}>{p.privacy}</Block>

      <div className="mt-5 border-t border-black pt-3">
        <ConsentRow label={p.consentLine} />
        <SigGrid
          phoneLabel={p.phoneLabel}
          nameLabel={p.nameLabel}
          signatureLabel={p.signatureLabel}
          dateLabel={p.dateLabel}
        />
        <div className="meta mt-3 border-t border-black/30 pt-2">
          {p.staffLabel} ____________ {p.byStaffLabel} ____________
        </div>
      </div>
    </section>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="meta">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function ConsentRow({ label }: { label: string }) {
  return (
    <div className="grid grid-cols-[0.3in_1fr] items-start gap-2">
      <div className="mt-0.5 h-4 w-4 border border-black" aria-hidden />
      <div className="text-[10pt]">{label}</div>
    </div>
  );
}

function SigGrid({
  phoneLabel,
  nameLabel,
  signatureLabel,
  dateLabel,
}: {
  phoneLabel: string;
  nameLabel: string;
  signatureLabel: string;
  dateLabel: string;
}) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
      <SigField label={phoneLabel} />
      <SigField label={nameLabel} />
      <SigField label={signatureLabel} />
      <SigField label={dateLabel} />
    </div>
  );
}

function SigField({ label }: { label: string }) {
  return (
    <div>
      <div className="border-b border-black pb-7" />
      <div className="meta mt-1">{label}</div>
    </div>
  );
}

function PrintHint() {
  return (
    <span className="text-base-content/60 text-xs">
      Use your browser&apos;s Print menu to save as PDF.
    </span>
  );
}

function buildDocId(today: Date): string {
  const ymd =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  return `AGCONN-SMS-${ymd}`;
}
