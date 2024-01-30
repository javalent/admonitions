import {
    Component,
    MarkdownPostProcessorContext,
    Notice,
    setIcon
} from "obsidian";
import { Admonition } from "src/@types";
import ObsidianAdmonition from "src/main";
import { CalloutSuggest } from "../suggest/suggest";

type Heights = Partial<{
    height: string;
    "padding-top": string;
    "padding-bottom": string;
    "margin-top": string;
    "margin-bottom": string;
}>;

export default class CalloutManager extends Component {
    /* ruleMap: Map<string, number> = new Map(); */
    constructor(public plugin: ObsidianAdmonition) {
        super();
    }

    onload() {
        //build sheet for custom admonitions

        document.head.appendChild(this.style);

        for (const admonition of Object.values(
            this.plugin.data.userAdmonitions
        )) {
            this.addAdmonition(admonition);
        }
        this.setUseSnippet();

        this.plugin.registerEditorSuggest(new CalloutSuggest(this.plugin));

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
        //apply metadata

        const type = callout.dataset.callout;
        const admonition = this.plugin.admonitions[type];
        if (!admonition) return;

        const titleEl = callout.querySelector<HTMLDivElement>(".callout-title");
        const content =
            callout.querySelector<HTMLDivElement>(".callout-content");

        const section = ctx.getSectionInfo(el);
        if (section) {
            const { text, lineStart, lineEnd } = section;
            const definition = text.split("\n")[lineStart];

            const [, metadata] = definition.match(/> \[!.+\|(.*)]/) ?? [];
            if (metadata) {
                callout.dataset.calloutMetadata = metadata;
            }

            if (
                content &&
                (this.plugin.admonitions[type].copy ??
                    this.plugin.data.copyButton)
            ) {
                let copy = content.createDiv("admonition-content-copy");
                setIcon(copy, "copy");
                copy.addEventListener("click", () => {
                    navigator.clipboard
                        .writeText(
                            text
                                .split("\n")
                                .slice(lineStart + 1, lineEnd + 1)
                                .join("\n")
                                .replace(/^> /gm, "")
                        )
                        .then(async () => {
                            new Notice("Callout content copied to clipboard.");
                        });
                });
            }
        }

        if (admonition.noTitle && !callout.dataset.calloutFold) {
            if (
                titleEl
                    .querySelector(".callout-title-inner")
                    ?.textContent?.toLowerCase() ===
                admonition.type.toLowerCase()
            ) {
                titleEl.addClass("no-title");
            }
        }
        if (
            !admonition.noTitle &&
            this.plugin.data.autoCollapse &&
            !callout.dataset.calloutFold
        ) {
            this.setCollapsible(callout);
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
        if (this.plugin.data.dropShadow) {
            callout.addClass("drop-shadow");
        }
    }

    setCollapsible(callout: HTMLElement) {
        const titleEl = callout.querySelector<HTMLDivElement>(".callout-title");
        const content =
            callout.querySelector<HTMLDivElement>(".callout-content");

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
            this.collapse(callout, event);
        };
    }

    collapse(callout: HTMLElement, event?: MouseEvent) {
        event?.preventDefault();
        const content =
            callout.querySelector<HTMLDivElement>(".callout-content");

        function transitionEnd(evt: TransitionEvent) {
            content.removeEventListener("transitionend", transitionEnd);
            content.style.removeProperty("transition");
        }
        content.addEventListener("transitionend", transitionEnd);
        content.style.setProperty(
            "transition",
            "all 100ms cubic-bezier(.02, .01, .47, 1)"
        );
        let collapsed = callout.hasClass("is-collapsed");

        if (!event || event.button == 0) {
            const heights = this.getComputedHeights(content);
            for (const prop of this.heights) {
                content.style.setProperty(
                    prop,
                    collapsed ? heights[prop] : "0px"
                );
            }

            callout.toggleClass("is-collapsed", !collapsed);
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
    generateCssString() {
        const sheet = [
            `/* This snippet was auto-generated by the Admonitions plugin */\n\n`
        ];
        for (const rule of Array.from(this.sheet.cssRules)) {
            sheet.push(rule.cssText);
        }
        return sheet.join("\n\n");
    }
    addAdmonition(admonition: Admonition) {
        if (!admonition.icon) return;
        let rule: string;
        const color =
            admonition.injectColor ?? this.plugin.data.injectColor
                ? `--callout-color: ${admonition.color};`
                : "";
        if (admonition.icon.type == "obsidian") {
            rule = `.callout[data-callout="${admonition.type.toLowerCase()}"] {
    ${color}
    --callout-icon: ${
        admonition.icon.name
    };  /* Icon name from the Obsidian Icon Set */
}`;
        } else {
            rule = `.callout[data-callout="${admonition.type.toLowerCase()}"] {
       ${color}
        --callout-icon: "${(
            this.plugin.iconManager.getIconNode(admonition.icon)?.outerHTML ??
            ""
        )
            .replace(/(width|height)=(\\?"|')\d+(\\?"|')/g, "")
            .replace(/"/g, '\\"')}";
    }`;
        }
        if (this.indexing.contains(admonition.type)) {
            this.sheet.deleteRule(this.indexing.indexOf(admonition.type));
        }
        this.indexing = [
            ...this.indexing.filter((type) => type != admonition.type),
            admonition.type
        ];
        this.sheet.insertRule(rule, this.sheet.cssRules.length);
        this.updateSnippet();
    }
    indexing: string[] = [];
    removeAdmonition(admonition: Admonition) {
        if (!this.indexing.contains(admonition.type)) return;
        const index = this.indexing.indexOf(admonition.type);
        this.sheet.deleteRule(index);
        this.indexing.splice(index, 1);
        this.updateSnippet();
    }
    style = document.head.createEl("style", {
        attr: { id: "ADMONITIONS_CUSTOM_STYLE_SHEET" }
    });
    get sheet() {
        return this.style.sheet;
    }

    unload() {
        this.style.detach();
    }

    get snippetPath() {
        return this.plugin.app.customCss.getSnippetPath(
            this.plugin.data.snippetPath
        );
    }
    setUseSnippet() {
        if (this.plugin.data.useSnippet) {
            this.updateSnippet();
        }
    }
    async updateSnippet() {
        if (!this.plugin.data.useSnippet) return;
        if (await this.plugin.app.vault.adapter.exists(this.snippetPath)) {
            await this.plugin.app.vault.adapter.write(
                this.snippetPath,
                this.generateCssString()
            );
        } else {
            await this.plugin.app.vault.create(
                this.snippetPath,
                this.generateCssString()
            );
        }
        this.plugin.app.customCss.setCssEnabledStatus(
            this.plugin.data.snippetPath,
            true
        );
        this.plugin.app.customCss.readSnippets();
    }
}
