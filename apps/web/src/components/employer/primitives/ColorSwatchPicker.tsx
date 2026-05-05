'use client';

type Swatch = { value: string; label: string; hex: string };

type ColorSwatchPickerProps = {
    swatches: Array<Swatch>;
    value: string;
    onChange: (v: string) => void;
    name?: string;
    ariaLabel?: string;
};

export function ColorSwatchPicker({
    swatches,
    value,
    onChange,
    name,
    ariaLabel,
}: ColorSwatchPickerProps) {
    return (
        <fieldset role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-3">
            {name && <input type="hidden" name={name} value={value} />}
            {swatches.map((sw) => {
                const selected = sw.value === value;
                return (
                    <div key={sw.value} className="tooltip" data-tip={sw.label}>
                        <button
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={sw.label}
                            onClick={() => onChange(sw.value)}
                            className={[
                                'h-10 w-10 rounded-full border-2 ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                selected
                                    ? 'border-base-100 ring-2 ring-primary'
                                    : 'border-base-300 hover:scale-105',
                            ].join(' ')}
                            style={{ backgroundColor: sw.hex }}
                        />
                    </div>
                );
            })}
        </fieldset>
    );
}
