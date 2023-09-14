import { Admonition, AdmonitionIconDefinition } from "src/@types";
import { t } from "src/lang/helpers";
import ObsidianAdmonition from "src/main";

type ValidationSuccess = {
    success: true;
    messages?: string[];
};
type ValidationError = {
    success: false;
    failed: "type" | "icon" | "rgb" | "title" | "booleans";
    message: string;
};
type Result = ValidationSuccess | ValidationError;

export const isSelectorValid = ((dummyElement) => (selector: string) => {
    try {
        dummyElement.querySelector(selector);
    } catch {
        return false;
    }
    return true;
})(document.createDocumentFragment());

export class AdmonitionValidator {
    static validateImport(
        plugin: ObsidianAdmonition,
        admonition: Admonition
    ): Result {
        const result: Result = {
            success: true,
            messages: []
        };
        const validType = AdmonitionValidator.validateType(
            admonition.type,
            plugin
        );
        if (validType.success == false) {
            return validType;
        }
        const iconName =
            typeof admonition.icon == "string"
                ? admonition.icon
                : typeof admonition.icon == "object"
                ? admonition.icon?.name
                : null;
        const validIcon = AdmonitionValidator.validateType(iconName, plugin);
        if (validIcon.success == false) {
            return validIcon;
        }

        const iconNode = plugin.iconManager.getIconNode(admonition.icon);
        if (!iconNode) {
            result.messages.push(
                "No installed icon found by the name " +
                    iconName +
                    ". Perhaps you need to install a new icon pack?"
            );
        }
        if (admonition.title && typeof admonition.title != "string") {
            return {
                success: false,
                failed: "title",
                message: "Admonition titles can only be strings."
            };
        }
        if (
            !("color" in admonition) ||
            !/(?:(?:2(?:[0-4]\d|5[0-5])|\d{1,2}|1\d\d)\s*,\s*){2}\s*(?:2(?:[0-4]\d|5[0-5])|\d{1,2}|1\d\d)/.test(
                admonition.color
            )
        ) {
            console.warn(
                "No color provided for the import of " +
                    admonition.type +
                    ". Adding a random color."
            );
            admonition.color = `${Math.floor(
                Math.random() * 255
            )}, ${Math.floor(Math.random() * 255)}, ${Math.floor(
                Math.random() * 255
            )}`;
        }
        const booleans: (keyof Admonition)[] = [
            "command",
            "injectColor",
            "noTitle",
            "copy"
        ];
        for (const key of booleans) {
            if (
                key in admonition &&
                typeof JSON.parse(JSON.stringify(admonition[key])) != "boolean"
            ) {
                return {
                    success: false,
                    failed: "booleans",
                    message: `The "${key}" property must be a boolean if present.`
                };
            }
        }
        return result;
    }
    static validate(
        plugin: ObsidianAdmonition,
        type: string,
        icon: AdmonitionIconDefinition,
        oldType?: string
    ): Result {
        const validType = AdmonitionValidator.validateType(
            type,
            plugin,
            oldType
        );
        if (validType.success == false) {
            return validType;
        }

        return AdmonitionValidator.validateIcon(icon, plugin);
    }
    static validateType(
        type: string,
        plugin: ObsidianAdmonition,
        oldType?: string
    ): Result {
        if (!type.length) {
            return {
                success: false,
                message: t("Admonition type cannot be empty."),
                failed: "type"
            };
        }

        if (type.includes(" ")) {
            return {
                success: false,
                message: t("Admonition type cannot include spaces."),
                failed: "type"
            };
        }
        if (!isSelectorValid(type)) {
            return {
                success: false,
                message: t("Types must be a valid CSS selector."),
                failed: "type"
            };
        }
        if (type != oldType && type in plugin.data.userAdmonitions) {
            return {
                success: false,
                message: "That Admonition type already exists.",
                failed: "type"
            };
        }
        return { success: true };
    }
    static validateIcon(
        definition: AdmonitionIconDefinition,
        plugin: ObsidianAdmonition
    ): Result {
        if (definition.type === "image") {
            return {
                success: true
            };
        }
        if (!definition.name?.length) {
            return {
                success: false,
                message: t("Icon cannot be empty."),
                failed: "icon"
            };
        }
        const icon = plugin.iconManager.getIconType(definition.name);
        if (!icon) {
            return {
                success: false,
                message: t("Invalid icon name."),
                failed: "icon"
            };
        }
        return {
            success: true
        };
    }
}
