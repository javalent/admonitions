import {
    MarkdownPostProcessorContext,
    MarkdownRenderChild,
    MarkdownRenderer,
    Notice,
    Plugin
} from "obsidian";
import { Admonition, ObsidianAdmonitionPlugin } from "../@types/types";
import { findIconDefinition, icon } from "./icons";

Object.fromEntries =
    Object.fromEntries ||
    /** Polyfill taken from https://github.com/tc39/proposal-object-from-entries/blob/master/polyfill.js */
    function <T = any>(
        entries: Iterable<readonly [PropertyKey, T]>
    ): { [k: string]: T } {
        const obj = {};

        for (const pair of entries) {
            if (Object(pair) !== pair) {
                throw new TypeError(
                    "iterable for fromEntries should yield objects"
                );
            }
            // Consistency with Map: contract is that entry has "0" and "1" keys, not
            // that it is an array or iterable.
            const { "0": key, "1": val } = pair;

            Object.defineProperty(obj, key, {
                configurable: true,
                enumerable: true,
                writable: true,
                value: val
            });
        }

        return obj;
    };

import "./main.css";
import AdmonitionSetting from "./settings";

const ADMONITION_MAP: {
    [admonitionType: string]: Admonition;
} = {
    note: { type: "note", color: "68, 138, 255", icon: "pencil-alt" },
    seealso: { type: "note", color: "68, 138, 255", icon: "pencil-alt" },
    abstract: { type: "abstract", color: "0, 176, 255", icon: "book" },
    summary: { type: "abstract", color: "0, 176, 255", icon: "book" },
    info: { type: "info", color: "0, 184, 212", icon: "info-circle" },
    todo: { type: "info", color: "0, 184, 212", icon: "info-circle" },
    tip: { type: "tip", color: "0, 191, 165", icon: "fire" },
    hint: { type: "tip", color: "0, 191, 165", icon: "fire" },
    important: { type: "tip", color: "0, 191, 165", icon: "fire" },
    success: { type: "success", color: "0, 200, 83", icon: "check-circle" },
    check: { type: "success", color: "0, 200, 83", icon: "check-circle" },
    done: { type: "success", color: "0, 200, 83", icon: "check-circle" },
    question: {
        type: "question",
        color: "100, 221, 23",
        icon: "question-circle"
    },
    help: { type: "question", color: "100, 221, 23", icon: "question-circle" },
    faq: { type: "question", color: "100, 221, 23", icon: "question-circle" },
    warning: {
        type: "warning",
        color: "255, 145, 0",
        icon: "exclamation-triangle"
    },
    caution: {
        type: "warning",
        color: "255, 145, 0",
        icon: "exclamation-triangle"
    },
    attention: {
        type: "warning",
        color: "255, 145, 0",
        icon: "exclamation-triangle"
    },
    failure: { type: "failure", color: "255, 82, 82", icon: "times-circle" },
    fail: { type: "failure", color: "255, 82, 82", icon: "times-circle" },
    missing: { type: "failure", color: "255, 82, 82", icon: "times-circle" },
    danger: { type: "danger", color: "255, 23, 68", icon: "bolt" },
    error: { type: "danger", color: "255, 23, 68", icon: "bolt" },
    bug: { type: "bug", color: "245, 0, 87", icon: "bug" },
    example: { type: "example", color: "124, 77, 255", icon: "list-ol" },
    quote: { type: "quote", color: "158, 158, 158", icon: "quote-right" },
    cite: { type: "quote", color: "158, 158, 158", icon: "quote-right" }
};
export default class ObsidianAdmonition
    extends Plugin
    implements ObsidianAdmonitionPlugin {
    admonitions: { [admonitionType: string]: Admonition } = {};
    userAdmonitions: { [admonitionType: string]: Admonition } = {};
    async saveSettings() {
        await this.saveData(this.userAdmonitions);
    }
    async loadSettings() {
        this.userAdmonitions = await this.loadData();

        this.admonitions = {
            ...ADMONITION_MAP,
            ...this.userAdmonitions
        };
    }
    async addAdmonition(admonition: Admonition): Promise<void> {
        this.userAdmonitions = {
            ...this.userAdmonitions,
            [admonition.type]: admonition
        };
        this.admonitions = {
            ...ADMONITION_MAP,
            ...this.userAdmonitions
        };
        this.registerMarkdownCodeBlockProcessor(
            `ad-${admonition.type}`,
            this.postprocessor.bind(this, admonition.type)
        );
        await this.saveSettings();
    }

    async removeAdmonition(admonition: Admonition) {
        if (this.userAdmonitions[admonition.type]) {
            delete this.userAdmonitions[admonition.type];
        }
        this.admonitions = {
            ...ADMONITION_MAP,
            ...this.userAdmonitions
        };
        await this.saveSettings();
    }
    async onload(): Promise<void> {
        console.log("Obsidian Admonition loaded");

        await this.loadSettings();

        this.addSettingTab(new AdmonitionSetting(this.app, this));

        Object.keys(this.admonitions).forEach((type) =>
            this.registerMarkdownCodeBlockProcessor(
                `ad-${type}`,
                this.postprocessor.bind(this, type)
            )
        );
    }
    postprocessor(
        type: string,
        src: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ) {
        if (!this.admonitions[type]) {
            return;
        }
        try {
            /**
             * Find title and collapse parameters.
             */
            let matchedParameters =
                src.match(/^\b(title|collapse)\b:([\s\S]*?)$/gm) || [];

            let params = Object.fromEntries(
                matchedParameters.map((p) =>
                    p.split(/:\s?/).map((s) => s.trim())
                )
            );

            let {
                title = type[0].toUpperCase() + type.slice(1).toLowerCase(),
                collapse
            } = params;

            /**
             * Get the content. Content should be everything that is not the title or collapse parameters.
             * Remove any "content: " fields (legacy from < v0.2.0)
             */
            let content = src.replace(
                /^\b(title|collapse)\b:([\s\S]*?)$/gm,
                ""
            );
            content = content.replace(/^\bcontent\b:\s?/gm, "");

            /**
             * If the admonition should collapse, but something other than open or closed was provided, set to closed.
             */
            if (
                Object.prototype.hasOwnProperty.call(params, "collapse") &&
                (params.collapse.length == 0 ||
                    params.collapse === undefined ||
                    collapse !== "open")
            ) {
                collapse = "closed";
            }
            /**
             * If the admonition should collapse, but title was blanked, set the default title.
             */
            if (
                Object.prototype.hasOwnProperty.call(params, "title") &&
                (params.title === undefined || params.title.length === 0) &&
                collapse
            ) {
                title = type[0].toUpperCase() + type.slice(1).toLowerCase();
                new Notice(
                    "An admonition must have a title if it is collapsible."
                );
            }

            /**
             * Build the correct admonition element.
             * Collapsible -> <details> <summary> Title </summary> <div> Content </div> </details>
             * Regular -> <div> <div> Title </div> <div> Content </div> </div>
             */
            let admonitionElement = this.getAdmonitionElement(
                type,
                title,
                collapse
            );

            /**
             * Create a unloadable component.
             */
            let admonitionContent = admonitionElement.createDiv({
                cls: "admonition-content"
            });
            let markdownRenderChild = new MarkdownRenderChild();
            markdownRenderChild.containerEl = admonitionElement;

            /**
             * Render the content as markdown and append it to the admonition.
             */
            MarkdownRenderer.renderMarkdown(
                content,
                admonitionContent,
                ctx.sourcePath,
                markdownRenderChild
            );

            /**
             * Replace the <pre> tag with the new admonition.
             */
            el.replaceWith(admonitionElement);
        } catch (e) {
            console.error(e);
            const pre = createEl("pre");

            pre.createEl("code", {
                attr: {
                    style: `color: var(--text-error) !important`
                }
            }).createSpan({
                text:
                    "There was an error rendering the admonition:" +
                    "\n\n" +
                    src
            });

            el.replaceWith(pre);
        }
    }
    getAdmonitionElement(
        type: string,
        title: string,
        collapse?: string
    ): HTMLElement {
        let admonition,
            titleEl,
            attrs: { style: string; open?: string } = {
                style: `--admonition-color: ${this.admonitions[type].color};`
            };
        if (collapse) {
            if (collapse === "open") {
                attrs.open = "open";
            }
            admonition = createEl("details", {
                cls: `admonition admonition-${type}`,
                attr: attrs
            });
            titleEl = admonition.createEl("summary", {
                cls: `admonition-title ${
                    !title.trim().length ? "no-title" : ""
                }`
            });
        } else {
            admonition = createDiv({
                cls: `admonition admonition-${type}`,
                attr: attrs
            });
            titleEl = admonition.createDiv({
                cls: `admonition-title ${
                    !title.trim().length ? "no-title" : ""
                }`
            });
        }

        titleEl.createDiv({
            cls: `admonition-title-icon`
        }).innerHTML = icon(
            findIconDefinition({
                iconName: this.admonitions[type].icon
            })
        ).html[0];
        titleEl.createSpan({ text: title });
        return admonition;
    }
    async onunload() {
        console.log("Obsidian Admonition unloaded");
    }
}
