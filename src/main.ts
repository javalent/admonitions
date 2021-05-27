import {
    addIcon,
    MarkdownPostProcessorContext,
    MarkdownRenderChild,
    MarkdownRenderer,
    MarkdownView,
    Notice,
    Plugin,
    TFile
} from "obsidian";
import {
    Admonition,
    ObsidianAdmonitionPlugin,
    ISettingsData
} from "../@types/types";
import {
    getAdmonitionElement,
    getMatches,
    getParametersFromSource
} from "./util";
import {
    ADMONITION_MAP,
    ADD_ADMONITION_COMMAND_ICON,
    REMOVE_ADMONITION_COMMAND_ICON,
    ADD_COMMAND_NAME,
    REMOVE_COMMAND_NAME
} from "./constants";

import * as CodeMirror from "./codemirror";

//add commands to app interface
declare module "obsidian" {
    interface App {
        commands: {
            commands: { [id: string]: Command };
            editorCommands: { [id: string]: Command };
            findCommand(id: string): Command;
        };
    }
}
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
import { findIconDefinition, icon } from "./icons";

const DEFAULT_APP_SETTINGS: ISettingsData = {
    userAdmonitions: {},
    syntaxHighlight: false,
    copyButton: false,
    version: "",
    autoCollapse: false,
    defaultCollapseType: "open",
    syncLinks: true
};

export default class ObsidianAdmonition
    extends Plugin
    implements ObsidianAdmonitionPlugin
{
    admonitions: { [admonitionType: string]: Admonition } = {};
    /*     userAdmonitions: { [admonitionType: string]: Admonition } = {};
    syntaxHighlight: boolean; */
    data: ISettingsData;
    get types() {
        return Object.keys(this.admonitions);
    }
    async saveSettings() {
        await this.saveData(this.data);
    }

    async loadSettings() {
        let data = Object.assign(
            {},
            DEFAULT_APP_SETTINGS,
            await this.loadData()
        );

        this.data = data;

        this.admonitions = {
            ...ADMONITION_MAP,
            ...this.data.userAdmonitions
        };
        await this.saveSettings();
    }
    async addAdmonition(admonition: Admonition): Promise<void> {
        this.data.userAdmonitions = {
            ...this.data.userAdmonitions,
            [admonition.type]: admonition
        };
        this.admonitions = {
            ...ADMONITION_MAP,
            ...this.data.userAdmonitions
        };
        this.registerMarkdownCodeBlockProcessor(
            `ad-${admonition.type}`,
            this.postprocessor.bind(this, admonition.type)
        );
        if (this.data.syntaxHighlight) {
            this.turnOnSyntaxHighlighting([admonition.type]);
        }
        await this.saveSettings();
    }

    async removeAdmonition(admonition: Admonition) {
        if (this.data.userAdmonitions[admonition.type]) {
            delete this.data.userAdmonitions[admonition.type];
        }
        this.admonitions = {
            ...ADMONITION_MAP,
            ...this.data.userAdmonitions
        };

        if (this.data.syntaxHighlight) {
            this.turnOffSyntaxHighlighting([admonition.type]);
        }

        await this.saveSettings();
    }
    async onload(): Promise<void> {
        console.log("Obsidian Admonition loaded");

        await this.loadSettings();

        this.addSettingTab(new AdmonitionSetting(this.app, this));

        addIcon(ADD_COMMAND_NAME, ADD_ADMONITION_COMMAND_ICON);
        addIcon(REMOVE_COMMAND_NAME, REMOVE_ADMONITION_COMMAND_ICON);

        Object.keys(this.admonitions).forEach((type) => {
            this.registerMarkdownCodeBlockProcessor(
                `ad-${type}`,
                this.postprocessor.bind(this, type)
            );
            if (this.admonitions[type].command) {
                this.registerCommandsFor(this.admonitions[type]);
            }
        });
        if (this.data.syntaxHighlight) {
            this.turnOnSyntaxHighlighting();
        }

        this.addCommand({
            id: "collapse-admonitions",
            name: "Collapse Admonitions in Note",
            callback: () => {
                let view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!view || !(view instanceof MarkdownView)) return;

                let admonitions =
                    view.contentEl.querySelectorAll("details[open]");
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

        this.registerEvent(
            this.app.metadataCache.on("resolve", (file) => {
                if (this.app.workspace.getActiveFile() != file) return;

                const view =
                    this.app.workspace.getActiveViewOfType(MarkdownView);

                if (!view || !(view instanceof MarkdownView)) return;

                const admonitionLinks =
                    view.contentEl.querySelectorAll<HTMLAnchorElement>(
                        ".admonition a.internal-link"
                    );

                this.addLinksToCache(admonitionLinks, file.path);
            })
        );
    }
    unregisterCommandsFor(admonition: Admonition) {
        admonition.command = false;

        if (
            this.app.commands.findCommand(
                `obsidian-admonition:insert-${admonition.type}`
            )
        ) {
            delete this.app.commands.editorCommands[
                `obsidian-admonition:insert-${admonition.type}`
            ];
            delete this.app.commands.editorCommands[
                `obsidian-admonition:insert-${admonition.type}-with-title`
            ];
            delete this.app.commands.commands[
                `obsidian-admonition:insert-${admonition.type}`
            ];
            delete this.app.commands.commands[
                `obsidian-admonition:insert-${admonition.type}-with-title`
            ];
        }
    }
    registerCommandsFor(admonition: Admonition) {
        admonition.command = true;
        this.addCommand({
            id: `insert-${admonition.type}`,
            name: `Insert ${admonition.type}`,
            editorCallback: (editor, view) => {
                if (admonition.command) {
                    try {
                        editor.getDoc().replaceSelection(
                            `\`\`\`ad-${admonition.type}

\`\`\`\n`
                        );
                        const cursor = editor.getCursor();
                        editor.setCursor(cursor.line - 2);
                    } catch (e) {
                        new Notice(
                            "There was an issue inserting the admonition."
                        );
                    }
                }
            }
        });
        this.addCommand({
            id: `insert-${admonition.type}-with-title`,
            name: `Insert ${admonition.type} With Title`,
            editorCallback: (editor, view) => {
                if (admonition.command) {
                    try {
                        editor.getDoc().replaceSelection(
                            `\`\`\`ad-${admonition.type}
title: 

\`\`\`\n`
                        );
                        const cursor = editor.getCursor();
                        editor.setCursor(cursor.line - 3);
                    } catch (e) {
                        new Notice(
                            "There was an issue inserting the admonition."
                        );
                    }
                }
            }
        });
    }
    turnOnSyntaxHighlighting(types: string[] = Object.keys(this.admonitions)) {
        if (!this.data.syntaxHighlight) return;
        types.forEach((type) => {
            if (this.data.syntaxHighlight) {
                /** Process from @deathau's syntax highlight plugin */
                CodeMirror.defineMode(`ad-${type}`, (config, options) => {
                    return CodeMirror.getMode(config, "hypermd");
                });
            }
        });

        this.app.workspace.layoutReady
            ? this.layoutReady()
            : this.app.workspace.on(
                  "layout-ready",
                  this.layoutReady.bind(this)
              );
    }

    turnOffSyntaxHighlighting(types: string[] = Object.keys(this.admonitions)) {
        types.forEach((type) => {
            if (CodeMirror.modes.hasOwnProperty(`ad-${type}`)) {
                delete CodeMirror.modes[`ad-${type}`];
            }
        });
        this.app.workspace.layoutReady
            ? this.layoutReady()
            : this.app.workspace.on(
                  "layout-ready",
                  this.layoutReady.bind(this)
              );
    }

    layoutReady() {
        // don't need the event handler anymore, get rid of it
        this.app.workspace.off("layout-ready", this.layoutReady.bind(this));
        this.refreshLeaves();
    }

    refreshLeaves() {
        // re-set the editor mode to refresh the syntax highlighting
        this.app.workspace.iterateCodeMirrors((cm) =>
            cm.setOption("mode", cm.getOption("mode"))
        );
    }
    async postprocessor(
        type: string,
        src: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ) {
        if (!this.admonitions[type]) {
            return;
        }
        try {
            let {
                title = type[0].toUpperCase() + type.slice(1).toLowerCase(),
                collapse,
                content
            } = getParametersFromSource(type, src);

            let match = new RegExp(`^!!! ad-(${this.types.join("|")})$`, "gm");

            let nestedAdmonitions = content.match(match) || [];

            if (nestedAdmonitions.length) {
                let matches = [getMatches(content, 0, nestedAdmonitions[0])];
                for (let i = 1; i < nestedAdmonitions.length; i++) {
                    matches.push(
                        getMatches(
                            content,
                            matches[i - 1].end,
                            nestedAdmonitions[i]
                        )
                    );
                }

                let split = content.split("\n");

                for (let m of matches.reverse()) {
                    split.splice(
                        m.start,
                        m.end - m.start + 1,
                        `\`\`\`ad-${m.type}\n${m.src}\n\`\`\``
                    );
                }
                content = split.join("\n");
            }

            if (this.data.autoCollapse && !collapse) {
                collapse = this.data.defaultCollapseType ?? "open";
            } else if (collapse && collapse.trim() === "none") {
                collapse = "";
            }

            let admonitionElement = getAdmonitionElement(
                type,
                title,
                this.admonitions[type].icon,
                this.admonitions[type].color,
                collapse
            );
            /**
             * Create a unloadable component.
             */
            let markdownRenderChild = new MarkdownRenderChild(
                admonitionElement
            );
            markdownRenderChild.containerEl = admonitionElement;

            let admonitionContent = admonitionElement.createDiv({
                cls: "admonition-content"
            });

            /**
             * Render the content as markdown and append it to the admonition.
             */
            MarkdownRenderer.renderMarkdown(
                content,
                admonitionContent,
                ctx.sourcePath,
                markdownRenderChild
            );

            if (this.data.copyButton) {
                let copy = admonitionContent
                    .createDiv("admonition-content-copy")
                    .appendChild(
                        icon(
                            findIconDefinition({
                                iconName: "copy",
                                prefix: "far"
                            })
                        ).node[0]
                    );
                copy.addEventListener("click", () => {
                    navigator.clipboard
                        .writeText(content.trim())
                        .then(async () => {
                            new Notice(
                                "Admonition content copied to clipboard."
                            );
                        });
                });
            }

            const taskLists = admonitionContent.querySelectorAll(
                ".contains-task-list"
            );
            const splitContent = content.split("\n");

            for (let i = 0; i < taskLists.length; i++) {
                let tasks: NodeListOf<HTMLLIElement> =
                    taskLists[i].querySelectorAll(".task-list-item");
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

            const links =
                admonitionContent.querySelectorAll<HTMLAnchorElement>(
                    "a.internal-link"
                );

            this.addLinksToCache(links, ctx.sourcePath);

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
    async onunload() {
        console.log("Obsidian Admonition unloaded");

        this.turnOffSyntaxHighlighting();
    }
    addLinksToCache(
        links: NodeListOf<HTMLAnchorElement>,
        sourcePath: string
    ): void {
        if (!this.data.syncLinks) return;
        /* //@ts-expect-error
        this.app.metadataCache.resolveLinks(sourcePath); */
        for (let i = 0; i < links.length; i++) {
            const a = links[i];
            if (a.dataset.href) {
                let file = this.app.metadataCache.getFirstLinkpathDest(
                    a.dataset.href,
                    ""
                );
                let cache, path;
                if (file && file instanceof TFile) {
                    cache = this.app.metadataCache.resolvedLinks;
                    path = file.path;
                } else {
                    cache = this.app.metadataCache.unresolvedLinks;
                    path = a.dataset.href;
                }
                if (!cache[sourcePath]) {
                    cache[sourcePath] = {
                        [path]: 0
                    };
                }
                let resolved = cache[sourcePath];
                if (!resolved[path]) {
                    resolved[path] = 0;
                }
                resolved[path] += 1;
                cache[sourcePath] = resolved;
            }
        }
    }
}
