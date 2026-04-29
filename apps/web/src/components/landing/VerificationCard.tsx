const fields = [
  { label: 'License No.', value: 'FLC-LIC-2026-04829' },
  { label: 'Issued', value: '2026-01-14' },
  { label: 'Expires', value: '2027-01-13' },
  { label: 'MSPA Reg.', value: 'DOL-MSPA-CA-04829-26' },
];

export function VerificationCard() {
  return (
    <div className="border-hairline flex w-full max-w-[560px] flex-col gap-6 border bg-white p-12 shadow-[0_30px_60px_rgba(45,64,48,0.12)]">
      <div className="flex items-center justify-between">
        <span className="text-soil font-mono text-[11px] tracking-[0.18em]">VERIFICATION RECORD</span>
        <span className="text-soil font-mono text-[11px]">2026-04-29 09:41 PT</span>
      </div>

      <div className="flex items-start gap-4">
        <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
          <circle cx="28" cy="28" r="27" stroke="#2D4030" strokeWidth="2" fill="none" />
          <circle
            cx="28"
            cy="28"
            r="22"
            stroke="#C8A24A"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="2 3"
          />
          <path d="M18 28 L25 35 L38 21" stroke="#2D4030" strokeWidth="3" fill="none" />
        </svg>
        <div className="flex flex-col gap-1.5">
          <p className="text-ink font-serif text-[28px] font-semibold leading-tight tracking-[-0.02em]">
            Driscoll's Madera Ranch
          </p>
          <p className="text-soil font-sans text-sm">FLC license verified against CA DIR/DLSE</p>
        </div>
      </div>

      <div className="border-hairline flex flex-col border">
        <div className="bg-bone-warm flex items-center px-4 py-3">
          <span className="text-soil flex-1 font-mono text-[11px] font-medium tracking-[0.06em]">
            FIELD
          </span>
          <span className="text-soil flex-[1.5] font-mono text-[11px] font-medium tracking-[0.06em]">
            VALUE
          </span>
        </div>
        {fields.map((f) => (
          <div key={f.label} className="border-hairline flex items-center border-t px-4 py-3">
            <span className="text-soil flex-1 font-mono text-[13px]">{f.label}</span>
            <span className="text-ink flex-[1.5] font-mono text-[13px]">{f.value}</span>
          </div>
        ))}
        <div className="border-hairline flex items-center border-t px-4 py-3">
          <span className="text-soil flex-1 font-mono text-[13px]">Status</span>
          <div className="flex-[1.5]">
            <span className="bg-moss inline-block px-2 py-0.5">
              <span className="text-bone font-mono text-[11px] tracking-[0.06em]">
                VERIFIED · ON RECORD
              </span>
            </span>
          </div>
        </div>
      </div>

      <p className="border-hairline border-t pt-3.5 text-soil font-sans text-[13px] leading-snug">
        Verified by AgConn admin against permits.dir.ca.gov · re-verified nightly · workers see only
        the badge, never the raw record.
      </p>
    </div>
  );
}
