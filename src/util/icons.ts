import { faCopy, far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import {
    IconDefinition,
    findIconDefinition,
    icon,
    library
} from "@fortawesome/fontawesome-svg-core";

import type { IconName } from "@fortawesome/fontawesome-svg-core";

import { RPG } from "./rpgawesome";
import { AdmonitionIconDefinition, RPGIconName } from "src/@types";

library.add(fas, far, fab, faCopy);

export const COPY_BUTTON_ICON = icon(
    findIconDefinition({
        iconName: "copy",
        prefix: "far"
    })
).node[0];

export const WARNING_ICON = icon(
    findIconDefinition({
        iconName: "exclamation-triangle",
        prefix: "fas"
    })
).node[0];

export { IconName };

const RPGIconNames: Map<IconName | RPGIconName, AdmonitionIconDefinition> =
    new Map(
        Object.keys(RPG).map((i) => {
            return [
                i as RPGIconName,
                {
                    name: i as RPGIconName,
                    type: "rpg" as "rpg"
                }
            ];
        })
    );
const FontAwesomeIconNames: Map<IconName, AdmonitionIconDefinition> = new Map(
    [Object.values(fas), Object.values(far), Object.values(fab)]
        .flat()
        .map((i: IconDefinition) => {
            return [
                i.iconName,
                { name: i.iconName, type: "font-awesome" as "font-awesome" }
            ];
        })
);

export const iconDefinitions = [
    ...FontAwesomeIconNames.values(),
    ...RPGIconNames.values()
];

export function getIconType(str: string): "rpg" | "font-awesome" {
    if (findIconDefinition({ iconName: str as IconName, prefix: "fas" }))
        return "font-awesome";
    if (findIconDefinition({ iconName: str as IconName, prefix: "far" }))
        return "font-awesome";
    if (findIconDefinition({ iconName: str as IconName, prefix: "fab" }))
        return "font-awesome";
    if (RPG[str as RPGIconName]) return "rpg";
}

export function getIconModuleName(icon: AdmonitionIconDefinition) {
    if (icon.type === "rpg") return "RPG Awesome";
    if (icon.type === "font-awesome") return "Font Awesome";
}

export function getIconNode(item: AdmonitionIconDefinition): Element {
    if (item.type === "image") {
        const img = new Image();
        img.src = item.name;
        return img;
    }
    if (item.type === "rpg") {
        if (!RPG[item.name as RPGIconName]) return null;
        const el = createDiv();
        el.innerHTML = RPG[item.name as RPGIconName];
        return el.children[0];
    }
    if (
        findIconDefinition({
            iconName: item.name as IconName,
            prefix: "fas"
        })
    )
        return icon(
            findIconDefinition({
                iconName: item.name as IconName,
                prefix: "fas"
            })
        ).node[0];
    if (
        findIconDefinition({
            iconName: item.name as IconName,
            prefix: "far"
        })
    )
        return icon(
            findIconDefinition({
                iconName: item.name as IconName,
                prefix: "far"
            })
        ).node[0];
    if (
        findIconDefinition({
            iconName: item.name as IconName,
            prefix: "fab"
        })
    )
        return icon(
            findIconDefinition({
                iconName: item.name as IconName,
                prefix: "fab"
            })
        ).node[0];
}
