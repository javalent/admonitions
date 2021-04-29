import {
    MarkdownPostProcessorContext,
    MarkdownRenderChild,
    MarkdownRenderer,
    MarkdownView,
    Notice,
    Plugin
} from "obsidian";
import { Admonition, ObsidianAdmonitionPlugin } from "../@types/types";
import { findIconDefinition, icon } from "./icons";

import * as CodeMirror from "./codemirror";

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

/* const compareVersions = (a: string, b: string) => {
    return a.localeCompare(b, undefined, { numeric: true }) === 1;
}; */

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
    syntaxHighlight: boolean;
    async saveSettings() {
        await this.saveData({
            syntaxHighlight: this.syntaxHighlight || false,
            userAdmonitions: this.userAdmonitions || {},
            version: this.manifest.version
        });
    }
    async loadSettings() {
        let data = Object.assign({}, await this.loadData());

        if (!Object.prototype.hasOwnProperty.call(data, "syntaxHighlight")) {
            data = {
                userAdmonitions: data,
                syntaxHighlight: false
            };
        }

        let { userAdmonitions = {}, syntaxHighlight = false } = data || {};
        this.userAdmonitions = userAdmonitions;
        this.syntaxHighlight = syntaxHighlight;

        this.admonitions = {
            ...ADMONITION_MAP,
            ...this.userAdmonitions
        };
        await this.saveSettings();
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
        if (this.syntaxHighlight) {
            this.turnOnSyntaxHighlighting([admonition.type]);
        }
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

        if (this.syntaxHighlight) {
            this.turnOffSyntaxHighlighting([admonition.type]);
        }

        await this.saveSettings();
    }
    async onload(): Promise<void> {
        console.log("Obsidian Admonition loaded");

        await this.loadSettings();

        this.addSettingTab(new AdmonitionSetting(this.app, this));

        Object.keys(this.admonitions).forEach((type) => {
            this.registerMarkdownCodeBlockProcessor(
                `ad-${type}`,
                this.postprocessor.bind(this, type)
            );
        });
        if (this.syntaxHighlight) {
            this.turnOnSyntaxHighlighting();
        }

        this.addCommand({
            id: "collapse-admonitions",
            name: "Collapse Admonitions in Note",
            callback: () => {
                let view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!view || !(view instanceof MarkdownView)) return;

                let admonitions = view.contentEl.querySelectorAll(
                    "details[open]"
                );
                for (let i = 0; i < admonitions.length; i++) {
                    let admonition = admonitions[i];
                    admonition.removeAttribute("open");
                }
            }
        });
        this.addCommand({
            id: "open-admonitions",
            name: "Open Admonitions in Note",
            callback: () => {
                let view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!view || !(view instanceof MarkdownView)) return;

                let admonitions = view.contentEl.querySelectorAll(
                    "details:not([open])"
                );
                for (let i = 0; i < admonitions.length; i++) {
                    let admonition = admonitions[i];
                    admonition.setAttribute("open", "open");
                }
            }
        });
    }
    turnOnSyntaxHighlighting(types: string[] = Object.keys(this.admonitions)) {
        if (!this.syntaxHighlight) return;
        types.forEach((type) => {
            if (this.syntaxHighlight) {
                /** Process from @deathau's syntax highlight plugin */
                CodeMirror.defineMode(`ad-${type}`, (config, options) => {
                    return CodeMirror.getMode(config, "hypermd");
                });
            }
        });

        this.app.workspace.layoutReady
            ? this.layoutReady()
            : this.app.workspace.on("layout-ready", this.layoutReady);
    }

    turnOffSyntaxHighlighting(types: string[] = Object.keys(this.admonitions)) {
        types.forEach((type) => {
            if (CodeMirror.modes.hasOwnProperty(`ad-${type}`)) {
                delete CodeMirror.modes[`ad-${type}`];
            }
        });
        this.app.workspace.layoutReady
            ? this.layoutReady()
            : this.app.workspace.on("layout-ready", this.layoutReady);
    }

    layoutReady() {
        // don't need the event handler anymore, get rid of it
        this.app.workspace.off("layout-ready", this.layoutReady);
        this.refreshLeaves();
    }

    refreshLeaves() {
        // re-set the editor mode to refresh the syntax highlighting
        this.app.workspace.iterateCodeMirrors((cm) =>
            cm.setOption("mode", cm.getOption("mode"))
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
            let markdownRenderChild = new MarkdownRenderChild(
                admonitionElement
            );
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

            const taskLists = admonitionContent.querySelectorAll(
                ".contains-task-list"
            );
            const splitContent = content.split("\n");

            for (let i = 0; i < taskLists.length; i++) {
                let tasks: NodeListOf<HTMLLIElement> = taskLists[
                    i
                ].querySelectorAll(".task-list-item");
                if (!tasks.length) continue;
                for (let j = 0; j < tasks.length; j++) {
                    let task = tasks[j];
                    if (!task.children.length) continue;
                    const inputs = task.querySelectorAll(
                        "input[type='checkbox']"
                    ) as NodeListOf<HTMLInputElement>;
                    if (!inputs.length) continue;
                    const input = inputs[0];

                    if (
                        !input.nextSibling ||
                        input.nextSibling.nodeName != "#text"
                    )
                        continue;
                    const innerText = input.nextSibling.textContent;

                    const search = new RegExp(
                        `\\[\\s?[xX]?\\s?\\]\\s*${innerText}`
                    );

                    const line = splitContent.find((l) => search.test(l));

                    input.dataset["line"] = `${splitContent.indexOf(line) + 1}`;
                }
            }

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

        let titleContentEl = createDiv("title-content");
        MarkdownRenderer.renderMarkdown(title, titleContentEl, "", null);
        
        const iconEl = createDiv("admonition-title-icon");
        iconEl.appendChild(
            icon(
                findIconDefinition({
                    iconName: this.admonitions[type].icon
                })
            ).node[0]
        );
        titleContentEl.children[0].prepend(iconEl);
        titleEl.appendChild(titleContentEl.children[0]);

        if (collapse) {
            titleEl.createDiv("collapser").createDiv("handle");
        }
        return admonition;
    }
    async onunload() {
        console.log("Obsidian Admonition unloaded");

        this.turnOffSyntaxHighlighting();
    }
}
