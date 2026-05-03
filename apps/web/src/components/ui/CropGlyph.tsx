import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCarrot,
    faChestnut,
    faCherries,
    faCitrus,
    faGrapes,
    faJarWheat,
    faLeafyGreen,
    faPeach,
    faPepperHot,
    faSeedling,
    faStrawberry,
    faTomato,
} from '@fortawesome/pro-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type Props = {
    glyph: string;
    size?: number;
    className?: string;
};

const ICONS: Record<string, IconDefinition> = {
    grape: faGrapes,
    almond: faChestnut,
    pistachio: faChestnut,
    walnut: faChestnut,
    citrus: faCitrus,
    tomato: faTomato,
    strawberry: faStrawberry,
    stone_fruit: faPeach,
    cherry: faCherries,
    lettuce: faLeafyGreen,
    leafy_greens: faLeafyGreen,
    carrot: faCarrot,
    pepper: faPepperHot,
    grain: faJarWheat,
    other: faSeedling,
};

export function CropGlyph({ glyph, size = 18, className }: Props) {
    const icon = ICONS[glyph] ?? faSeedling;
    return (
        <FontAwesomeIcon
            icon={icon}
            className={className}
            style={{ width: size, height: size }}
            aria-hidden="true"
        />
    );
}

export const CROP_TINT: Record<string, string> = {
    grape: 'text-secondary',
    almond: 'text-warning',
    citrus: 'text-accent',
    tomato: 'text-error',
    lettuce: 'text-success',
    strawberry: 'text-error',
};
