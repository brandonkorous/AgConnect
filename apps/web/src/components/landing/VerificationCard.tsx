import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';

const fields = [
    { label: 'License No.', value: 'FLC-LIC-2026-04829' },
    { label: 'Issued', value: '2026-01-14' },
    { label: 'Expires', value: '2027-01-13' },
    { label: 'MSPA Reg.', value: 'DOL-MSPA-CA-04829-26' },
];

export function VerificationCard() {
    return (
        <div className="border-base-300 flex w-full flex-col gap-6 border bg-base-100 p-12 shadow-xl">
            <div className="flex items-center justify-between">
                <span className="text-secondary font-mono text-xs tracking-widest">VERIFICATION RECORD</span>
                <span className="text-secondary font-mono text-xs">2026-04-29 09:41 PT</span>
            </div>

            <div className="flex items-start gap-4">
                <FontAwesomeIcon
                    icon={faCircleCheck}
                    className="text-primary text-[56px] shrink-0"
                />
                <div className="flex flex-col gap-1.5">
                    <p className="text-base-content font-serif text-3xl font-semibold leading-tight tracking-tight">
                        Driscoll's Madera Ranch
                    </p>
                    <p className="text-secondary font-sans text-sm">FLC license verified against CA DIR/DLSE</p>
                </div>
            </div>

            <div className="border-base-300 flex flex-col border">
                <div className="bg-base-200 flex items-center px-4 py-3">
                    <span className="text-secondary flex-1 font-mono text-xs font-medium tracking-wider">
                        FIELD
                    </span>
                    <span className="text-secondary flex-[1.5] font-mono text-xs font-medium tracking-wider">
                        VALUE
                    </span>
                </div>
                {fields.map((f) => (
                    <div key={f.label} className="border-base-300 flex items-center border-t px-4 py-3">
                        <span className="text-secondary flex-1 font-mono text-sm">{f.label}</span>
                        <span className="text-base-content flex-[1.5] font-mono text-sm">{f.value}</span>
                    </div>
                ))}
                <div className="border-base-300 flex items-center border-t px-4 py-3">
                    <span className="text-secondary flex-1 font-mono text-sm">Status</span>
                    <div className="flex-[1.5]">
                        <span className="badge badge-primary font-mono tracking-wider">
                            VERIFIED · ON RECORD
                        </span>
                    </div>
                </div>
            </div>

            <p className="border-base-300 border-t pt-3.5 text-secondary font-sans text-sm leading-snug">
                Auto-checked against the CA DIR/DLSE registry on signup and re-verified nightly,
                cross-referenced against the federal DOL MSPA list. Workers see only the badge,
                never the raw record.
            </p>
        </div>
    );
}
