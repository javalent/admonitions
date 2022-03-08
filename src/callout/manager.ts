import {
    addIcon,
    Component,
    MarkdownPostProcessorContext,
    setIcon
} from "obsidian";
import { Admonition } from "src/@types";
import ObsidianAdmonition from "src/main";
import AdmonitionSuggest from "./suggest";

type Heights = Partial<{
    height: string;
    "padding-top": string;
    "padding-bottom": string;
    "margin-top": string;
    "margin-bottom": string;
}>;

export default class CalloutManager extends Component {
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

        this.plugin.registerEditorSuggest(new AdmonitionSuggest(this.plugin));

        this.plugin.registerMarkdownPostProcessor(
            this.calloutProcessor.bind(this)
        );
    }
    heights: Array<keyof Heights> = [
        "height",
        "padding-top",
        "padding-bottom",
        "margin-top",
        "margin-bottom"
    ];
    heightMap: WeakMap<HTMLDivElement, Heights> = new WeakMap();
    calloutProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        const callout = el?.querySelector<HTMLDivElement>(".callout");
        if (!callout) return;

        const type = callout.dataset.callout;
        const admonition = this.plugin.data.userAdmonitions[type];
        if (!admonition) return;

        const titleEl = callout.querySelector<HTMLDivElement>(".callout-title");
        const content =
            callout.querySelector<HTMLDivElement>(".callout-content");

        if (admonition.noTitle && !callout.dataset.calloutFold) {
            titleEl.addClass("no-title");
        }
        if (
            !admonition.noTitle &&
            this.plugin.data.autoCollapse &&
            !callout.dataset.calloutFold
        ) {
            if (!content) return;
            callout.addClass("is-collapsible");
            if (this.plugin.data.defaultCollapseType == "closed") {
                callout.dataset.calloutFold = "-";
                callout.addClass("is-collapsed");
            } else {
                callout.dataset.calloutFold = "+";
            }

            const iconEl = titleEl.createDiv("callout-fold");

            setIcon(iconEl, "chevron-down");

            let collapsed = callout.hasClass("is-collapsed");

            this.getComputedHeights(content);

            if (collapsed) {
                for (const prop of this.heights) {
                    content.style.setProperty(prop, "0px");
                }
            }
            titleEl.onclick = (event: MouseEvent) => {
                event.preventDefault();

                function transitionEnd(evt: TransitionEvent) {
                    content.removeEventListener("transitionend", transitionEnd);
                    content.style.removeProperty("transition");
                }
                content.addEventListener("transitionend", transitionEnd);
                content.style.setProperty(
                    "transition",
                    "all 100ms cubic-bezier(.02, .01, .47, 1)"
                );
                collapsed = callout.hasClass("is-collapsed");
                if (event.button == 0) {
                    for (const prop of this.heights) {
                        const heights = this.getComputedHeights(content);
                        content.style.setProperty(
                            prop,
                            collapsed ? heights[prop] : "0px"
                        );
                    }

                    callout.toggleClass("is-collapsed", !collapsed);
                }
            };
        }

        if (
            admonition.title &&
            titleEl.textContent ==
                type[0].toUpperCase() + type.slice(1).toLowerCase()
        ) {
            const titleContentEl = titleEl.querySelector<HTMLDivElement>(
                ".callout-title-inner"
            );
            if (titleContentEl) {
                titleContentEl.setText(admonition.title);
            }
        }
    }
    getComputedHeights(el: HTMLDivElement): Heights {
        if (this.heightMap.has(el)) {
            return this.heightMap.get(el);
        }
        const style = getComputedStyle(el);
        const heights: Heights = {};
        for (const key of this.heights) {
            heights[key] = style.getPropertyValue(key);
        }
        this.heightMap.set(el, heights);
        return heights;
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
