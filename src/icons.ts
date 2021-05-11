import { faCopy } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import {
    IconDefinition,
    IconName,
    findIconDefinition,
    icon,
    library
} from "@fortawesome/fontawesome-svg-core";

library.add(fas, faCopy);

export const iconNames = Object.values(fas).map(
    (i: IconDefinition) => i.iconName
);

export { icon, findIconDefinition, IconName };
