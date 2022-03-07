import { addIcon, Component } from "obsidian";
import { Admonition } from "src/@types";
import ObsidianAdmonition from "src/main";

export default class StyleManager extends Component {
    ruleMap: Map<Admonition, number> = new Map();
    constructor(public plugin: ObsidianAdmonition) {
        super();
    }

    onload() {
        //build sheet for custom admonitions

        for (const admonition of Object.values(
            this.plugin.data.userAdmonitions
        )) {
            this.addAdmonition(admonition);
        }
    }
    addAdmonition(admonition: Admonition) {
        addIcon(
            `ADMONITION_ICON_MANAGER_${admonition.type}`,
            this.plugin.iconManager
                .getIconNode(admonition.icon)
                .outerHTML.replace(/(width|height)=(\\?"|')\d+(\\?"|')/g, "")
        );
        const rule = `.callout[data-callout="${admonition.type}"] {
    --callout-color: ${admonition.color}; /* RGB Tuple (just like admonitions) */
    --callout-icon: ADMONITION_ICON_MANAGER_${admonition.type};  /* Icon name from the Obsidian Icon Set */
}`;
        this.ruleMap.set(admonition, this.sheet.insertRule(rule));
    }
    removeAdmonition(admonition: Admonition) {
        if (!this.ruleMap.has(admonition)) return;
        this.sheet.deleteRule(this.ruleMap.get(admonition));
    }
    style = document.head.createEl("style", {
        attr: { id: "ADMONITIONS_CUSTOM_STYLE_SHEET" }
    });
    sheet = this.style.sheet;

    unload() {
        this.style.detach();
    }
}
