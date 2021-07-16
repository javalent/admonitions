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
/* import { prettyPrint as html } from "html"; */

import {
    Admonition,
    ObsidianAdmonitionPlugin,
    ISettingsData,
    RPGIconName
} from "./@types";
import {
    getAdmonitionElement,
    getAdmonitionElementAsync,
    getID,
    getMatches,
    getParametersFromSource
} from "./util";
import {
    ADMONITION_MAP,
    ADD_ADMONITION_COMMAND_ICON,
    REMOVE_ADMONITION_COMMAND_ICON,
    ADD_COMMAND_NAME,
    REMOVE_COMMAND_NAME
} from "./util";

import * as CodeMirror from "./codemirror/codemirror";

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

import "./assets/main.css";
import AdmonitionSetting from "./settings";
import { IconName, COPY_BUTTON_ICON, iconNames } from "./util/icons";
import { InsertAdmonitionModal } from "./modal";

const DEFAULT_APP_SETTINGS: ISettingsData = {
    userAdmonitions: {},
    syntaxHighlight: false,
    copyButton: false,
    version: "",
    autoCollapse: false,
    defaultCollapseType: "open",
    syncLinks: true,
    enableMarkdownProcessor: false
};

export default class ObsidianAdmonition
    extends Plugin
    implements ObsidianAdmonitionPlugin
{
    admonitions: { [admonitionType: string]: Admonition } = {};
    data: ISettingsData;
    contextMap: Map<string, MarkdownPostProcessorContext> = new Map();
    get types() {
        return Object.keys(this.admonitions);
    }
    get admonitionArray() {
        return Object.keys(this.admonitions).map((key) => {
            return {
                ...this.admonitions[key],
                type: key
            };
        });
    }
    async saveSettings() {
        this.data.version = this.manifest.version;
        await this.saveData(this.data);
    }

    async loadSettings() {
        let data = Object.assign(
            {},
            DEFAULT_APP_SETTINGS,
            await this.loadData()
        );

        this.data = data;

        if (
            this.data.userAdmonitions &&
            (!this.data.version || Number(this.data.version.split(".")[0]) < 5)
        ) {
            for (let admonition in this.data.userAdmonitions) {
                if (
                    Object.prototype.hasOwnProperty.call(
                        this.data.userAdmonitions[admonition],
                        "type"
                    )
                )
                    continue;
                this.data.userAdmonitions[admonition] = {
                    ...this.data.userAdmonitions[admonition],
                    icon: {
                        type: "font-awesome",
                        name: this.data.userAdmonitions[admonition]
                            .icon as unknown as IconName
                    }
                };
            }
        }

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

        if (admonition.command) {
            this.unregisterCommandsFor(admonition);
        }

        await this.saveSettings();
    }
    async onload(): Promise<void> {
        console.log("Obsidian Admonition loaded");

        await this.loadSettings();

        this.addSettingTab(new AdmonitionSetting(this.app, this));

        addIcon(ADD_COMMAND_NAME.toString(), ADD_ADMONITION_COMMAND_ICON);
        addIcon(REMOVE_COMMAND_NAME.toString(), REMOVE_ADMONITION_COMMAND_ICON);

        if (this.data.enableMarkdownProcessor) {
            this.enableMarkdownProcessor();
        }

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

        /** Add generic commands. */
        this.addCommand({
            id: "collapse-admonitions",
            name: "Collapse Admonitions in Note",
            checkCallback: (checking) => {
                // checking if the command should appear in the Command Palette
                if (checking) {
                    // make sure the active view is a MarkdownView.
                    return !!this.app.workspace.getActiveViewOfType(
                        MarkdownView
                    );
                }
                let view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!view || !(view instanceof MarkdownView)) return;

                let admonitions = view.contentEl.querySelectorAll(
                    "details[open].admonition-plugin"
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
            checkCallback: (checking) => {
                // checking if the command should appear in the Command Palette
                if (checking) {
                    // make sure the active view is a MarkdownView.
                    return !!this.app.workspace.getActiveViewOfType(
                        MarkdownView
                    );
                }
                let view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!view || !(view instanceof MarkdownView)) return;

                let admonitions = view.contentEl.querySelectorAll(
                    "details:not([open]).admonition-plugin"
                );
                for (let i = 0; i < admonitions.length; i++) {
                    let admonition = admonitions[i];
                    admonition.setAttribute("open", "open");
                }
            }
        });
        /*         this.addCommand({
            id: "replace-with-html",
            name: "Replace Admonitions with HTML",
            callback: async () => {
                let view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (
                    !view ||
                    !(view instanceof MarkdownView) ||
                    view.getMode() !== "preview"
                )
                    return;

                const ensure = new Modal(this.app);

                ensure.contentEl.createEl("h2", {
                    text: "This will overwrite all admonitions in the open note. Are you sure?"
                });
                new Setting(ensure.contentEl)
                    .addButton((b) =>
                        b.setButtonText("Yes").onClick(async () => {
                            let admonitions =
                                view.contentEl.querySelectorAll<HTMLElement>(
                                    ".admonition-plugin"
                                );

                            let content = (
                                (await this.app.vault.read(view.file)) ?? ""
                            ).split("\n");
                            if (!content) return;
                            for (let admonition of Array.from(
                                admonitions
                            ).reverse()) {
                                if (
                                    admonition.id &&
                                    this.contextMap.has(admonition.id)
                                ) {
                                    const ctx = this.contextMap.get(
                                        admonition.id
                                    );
                                    const { lineStart, lineEnd } =
                                        ctx.getSectionInfo(admonition) ?? {};
                                    if (!lineStart || !lineEnd) continue;

                                    const element = admonition.cloneNode(
                                        true
                                    ) as HTMLElement;

                                    element.removeAttribute("id");

                                    content.splice(
                                        lineStart,
                                        lineEnd - lineStart + 1,
                                        html(element.outerHTML)
                                    );
                                }
                            }
                            await this.app.vault.modify(
                                view.file,
                                content.join("\n")
                            );
                            ensure.close();
                        })
                    )
                    .addExtraButton((b) =>
                        b.setIcon("cross").onClick(() => ensure.close())
                    );
                ensure.open();
            }
        }); */

        this.addCommand({
            id: "insert-admonition",
            name: "Insert Admonition",
            editorCallback: (editor, view) => {
                let suggestor = new InsertAdmonitionModal(this, editor);
                suggestor.open();
            }
        });

        this.registerEvent(
            this.app.metadataCache.on("resolve", (file) => {
                if (!this.data.syncLinks) return;
                if (this.app.workspace.getActiveFile() != file) return;

                const view =
                    this.app.workspace.getActiveViewOfType(MarkdownView);

                if (!view || !(view instanceof MarkdownView)) return;

                const admonitionLinks =
                    view.contentEl.querySelectorAll<HTMLAnchorElement>(
                        ".admonition:not(.admonition-plugin-async) a.internal-link"
                    );

                this.addLinksToCache(admonitionLinks, file.path);
            })
        );
    }
    enableMarkdownProcessor() {
        if (!this.data.enableMarkdownProcessor) return;
        const TYPE_REGEX = new RegExp(
            `(!{3,}|\\?{3,}\\+?) ad-(${this.types.join("|")})(\\s[\\s\\S]+)?`
        );
        const END_REGEX = new RegExp(`\\-{3,} admonition`);

        let push = false,
            id: string;
        const childMap: Map<
            MarkdownRenderChild,
            { contentEl: HTMLElement; elements: Element[]; loaded: boolean }
        > = new Map();
        const elementMap: Map<Element, MarkdownRenderChild> = new Map();
        const idMap: Map<string, MarkdownRenderChild> = new Map();

        Object.values(this.admonitions)
            .filter(({ command }) => command)
            .forEach((admonition) => {
                this.registerCommandsFor(admonition);
            });

        this.registerMarkdownPostProcessor(async (el, ctx) => {
            if (!this.data.enableMarkdownProcessor) return;
            if (END_REGEX.test(el.textContent) && push) {
                push = false;
                const lastElement = createDiv();
                if (
                    id &&
                    idMap.has(id) &&
                    childMap.has(idMap.get(id)) &&
                    el.children[0].textContent.replace(END_REGEX, "").length
                ) {
                    lastElement.innerHTML = el.children[0].outerHTML.replace(
                        new RegExp(`(<br>)?\\n?${END_REGEX.source}`),
                        ""
                    );
                    const contentEl = childMap.get(idMap.get(id)).contentEl;
                    if (contentEl)
                        contentEl.appendChild(lastElement.children[0]);
                }

                el.children[0].detach();
                return;
            }

            if (!TYPE_REGEX.test(el.textContent) && !push) return;

            if (!push) {
                push = true;
                let child = new MarkdownRenderChild(el);
                id = getID();
                idMap.set(id, child);

                childMap.set(child, {
                    contentEl: null,
                    elements: [],
                    loaded: false
                });

                child.onload = async () => {
                    const source = el.textContent;

                    let [
                        ,
                        col,
                        type,
                        title = type[0].toUpperCase() +
                            type.slice(1).toLowerCase()
                    ]: string[] = source.match(TYPE_REGEX) ?? [];

                    if (!type) return;
                    let collapse;
                    if (/\?{3,}/.test(col)) {
                        collapse = /\+/.test(col) ? "open" : "closed";
                    }

                    if (
                        (title.trim() === "" || title === '""') &&
                        collapse !== undefined &&
                        collapse !== "none"
                    ) {
                        title =
                            type[0].toUpperCase() + type.slice(1).toLowerCase();
                        new Notice(
                            "An admonition must have a title if it is collapsible."
                        );
                    }

                    const admonitionElement = await getAdmonitionElementAsync(
                        type,
                        title.trim(),
                        this.admonitions[type].icon,
                        this.admonitions[type].color,
                        collapse
                    );

                    const contentHolder = admonitionElement.createDiv(
                        "admonition-content-holder"
                    );

                    const contentEl =
                        contentHolder.createDiv("admonition-content");

                    child.containerEl.appendChild(admonitionElement);
                    for (let element of childMap.get(child)?.elements) {
                        contentEl.appendChild(element);
                    }

                    childMap.set(child, {
                        ...childMap.get(child),
                        contentEl: contentEl,
                        loaded: true
                    });
                };

                child.onunload = () => {
                    idMap.delete(id);
                    childMap.delete(child);
                };

                ctx.addChild(child);

                el.children[0].detach();

                return;
            }

            if (id && idMap.get(id)) {
                const child = idMap.get(id);
                childMap.set(child, {
                    ...childMap.get(child),
                    elements: [
                        ...childMap.get(child).elements,
                        ...Array.from(el.children)
                    ]
                });
                elementMap.set(el, child);
                if (childMap.get(child)?.loaded) {
                    for (let element of childMap.get(child)?.elements) {
                        childMap.get(child).contentEl.appendChild(element);
                    }
                }
            }
        });
    }
    disableMarkdownProcessor() {
        /* new Notice("The plugin must be reloaded for this to take effect."); */
        Object.values(this.admonitions)
            .filter(({ command }) => command)
            .forEach((admonition) => {
                this.registerCommandsFor(admonition);
            });
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
            editorCheckCallback: (checking, editor, view) => {
                if (checking) return admonition.command;
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
            editorCheckCallback: (checking, editor, view) => {
                if (checking) return admonition.command;
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
        if (this.data.enableMarkdownProcessor) {
            this.addCommand({
                id: `insert-non-${admonition.type}`,
                name: `Insert Non-codeblock ${admonition.type}`,
                editorCheckCallback: (checking, editor, view) => {
                    if (checking)
                        return (
                            admonition.command &&
                            this.data.enableMarkdownProcessor
                        );
                    if (admonition.command) {
                        try {
                            editor
                                .getDoc()
                                .replaceSelection(
                                    `!!! ad-${admonition.type}\n\n--- admonition\n`
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
        }
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
                content,
                icon,
                color = this.admonitions[type].color
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
            const id = getID();

            /* const iconNode = icon ? this.admonitions[type].icon; */

            let admonitionElement = getAdmonitionElement(
                type,
                title,
                iconNames.get(icon as RPGIconName | IconName) ??
                    this.admonitions[type].icon,
                color ?? this.admonitions[type].color,
                collapse,
                id
            );

            /**
             * Create a unloadable component.
             */
            let markdownRenderChild = new MarkdownRenderChild(
                admonitionElement
            );
            markdownRenderChild.containerEl = admonitionElement;

            markdownRenderChild.onload = () => {
                this.contextMap.set(id, ctx);
            };
            markdownRenderChild.onunload = () => {
                this.contextMap.delete(id);
            };
            ctx.addChild(markdownRenderChild);

            const contentHolder = admonitionElement.createDiv(
                "admonition-content-holder"
            );

            const admonitionContent =
                contentHolder.createDiv("admonition-content");

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
                let copy = contentHolder
                    .createDiv("admonition-content-copy")
                    .appendChild(COPY_BUTTON_ICON.cloneNode(true));
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
            const splitContent = src.split("\n");

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
                    input.onclick = (evt) => {
                        evt.stopPropagation();
                    };
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
