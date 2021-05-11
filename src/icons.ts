import { fas } from "@fortawesome/free-solid-svg-icons";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import {
    findIconDefinition,
    icon,
    library
} from "@fortawesome/fontawesome-svg-core";

library.add(fas, faCopy);

export { icon, findIconDefinition };
