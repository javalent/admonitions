import {
    addIcon,
    MarkdownPostProcessor,
    MarkdownPostProcessorContext,
    MarkdownPreviewRenderer,
    MarkdownRenderChild,
    MarkdownRenderer,
    MarkdownView,
    normalizePath,
    Notice,
    Plugin,
    TFile
} from "obsidian";
/* import { prettyPrint as html } from "html"; */

import {
    Admonition,
    ObsidianAdmonitionPlugin,
    ISettingsData,
    AdmonitionIconDefinition
} from "./@types";
import { getID, getMatches, getParametersFromSource } from "./util";
import {
    ADMONITION_MAP,
    ADD_ADMONITION_COMMAND_ICON,
    REMOVE_ADMONITION_COMMAND_ICON,
    ADD_COMMAND_NAME,
    REMOVE_COMMAND_NAME
} from "./util";

/* import * as CodeMirror from "./codemirror/codemirror"; */
import type codemirror from "codemirror";

declare global {
    interface Window {
        CodeMirror: typeof codemirror;
    }
}

//add commands to app interface
declare module "obsidian" {
    interface App {
        commands: {
            commands: { [id: string]: Command };
            editorCommands: { [id: string]: Command };
            findCommand(id: string): Command;
        };
    }
    interface MarkdownPreviewView {
        renderer: MarkdownPreviewRenderer;
    }
    interface MarkdownPreviewRenderer {
        onCheckboxClick: (evt: MouseEvent, el: HTMLInputElement) => void;
        unregisterCodeBlockPostProcessor(lang: string): void;
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
import {
    IconName,
    COPY_BUTTON_ICON,
    iconDefinitions,
    getIconNode
} from "./util/icons";
import { InsertAdmonitionModal } from "./modal";

const DEFAULT_APP_SETTINGS: ISettingsData = {
    userAdmonitions: {},
    syntaxHighlight: false,
    copyButton: false,
    version: "",
    autoCollapse: false,
    defaultCollapseType: "open",
    syncLinks: true,
    enableMarkdownProcessor: false,
    injectColor: true,
    parseTitles: true
};

export default class ObsidianAdmonition
    extends Plugin
    implements ObsidianAdmonitionPlugin
{
    admonitions: { [admonitionType: string]: Admonition } = {};
    data: ISettingsData;

    postprocessors: Map<string, MarkdownPostProcessor> = new Map();

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
        if (this.data.syntaxHighlight) {
            this.turnOnSyntaxHighlighting([admonition.type]);
        }

        await this.saveSettings();
        const processor = this.registerMarkdownCodeBlockProcessor(
            `ad-${admonition.type}`,
            (src, el, ctx) => this.postprocessor(admonition.type, src, el, ctx)
        );
        this.postprocessors.set(admonition.type, processor);
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

        if (this.postprocessors.has(admonition.type)) {
            MarkdownPreviewRenderer.unregisterPostProcessor(
                this.postprocessors.get(admonition.type)
            );
            //@ts-expect-error
            MarkdownPreviewRenderer.unregisterCodeBlockPostProcessor(
                `ad-${admonition.type}`
            );
            this.postprocessors.delete(admonition.type);
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
            const processor = this.registerMarkdownCodeBlockProcessor(
                `ad-${type}`,
                (src, el, ctx) => this.postprocessor(type, src, el, ctx)
            );
            this.postprocessors.set(type, processor);
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
                if (
                    !(
                        Array.from(el.children).find((e) =>
                            TYPE_REGEX.test(e.textContent)
                        ) instanceof HTMLParagraphElement
                    )
                )
                    return;
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
                    const admonition = this.admonitions[type];
                    const admonitionElement =
                        await this.getAdmonitionElementAsync(
                            type,
                            title.trim(),
                            admonition.icon,
                            admonition.injectColor ?? this.data.injectColor
                                ? admonition.color
                                : null,
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
                const [, cmPatchedType] = `${type}`.match(
                    /^([\w+#-]*)[^\n`]*$/
                );
                window.CodeMirror.defineMode(
                    `ad-${cmPatchedType}`,
                    (config, options) => {
                        return window.CodeMirror.getMode({}, "hypermd");
                    }
                );
            }
        });

        this.app.workspace.layoutReady
            ? this.layoutReady()
            : this.app.workspace.onLayoutReady(this.layoutReady.bind(this));
    }

    turnOffSyntaxHighlighting(types: string[] = Object.keys(this.admonitions)) {
        types.forEach((type) => {
            if (window.CodeMirror.modes.hasOwnProperty(`ad-${type}`)) {
                delete window.CodeMirror.modes[`ad-${type}`];
            }
        });
        this.app.workspace.layoutReady
            ? this.layoutReady()
            : this.app.workspace.onLayoutReady(this.layoutReady.bind(this));
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
        ctx?: MarkdownPostProcessorContext
    ) {
        if (!this.admonitions[type]) {
            return;
        }
        try {
            const sourcePath =
                typeof ctx == "string"
                    ? ctx
                    : ctx?.sourcePath ??
                      this.app.workspace.getActiveFile()?.path ??
                      "";
            let { title, collapse, content, icon, color } =
                getParametersFromSource(type, src, this.admonitions[type]);

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
            const admonition = this.admonitions[type];
            let admonitionElement = this.getAdmonitionElement(
                type,
                title,
                iconDefinitions.find(({ name }) => icon === name) ??
                    admonition.icon,
                color ??
                    (admonition.injectColor ?? this.data.injectColor
                        ? admonition.color
                        : null),
                collapse,
                id
            );

            let markdownRenderChild = new MarkdownRenderChild(
                admonitionElement
            );
            markdownRenderChild.containerEl = admonitionElement;
            if (ctx && !(typeof ctx == "string")) {
                /**
                 * Create a unloadable component.
                 */
                markdownRenderChild.onload = () => {
                    /* this.contextMap.set(id, ctx); */
                };
                markdownRenderChild.onunload = () => {
                    /* this.contextMap.delete(id); */
                };
                ctx.addChild(markdownRenderChild);
            }

            if (content && content.length) {
                const contentHolder = admonitionElement.createDiv(
                    "admonition-content-holder"
                );

                const admonitionContent =
                    contentHolder.createDiv("admonition-content");

                /**
                 * Render the content as markdown and append it to the admonition.
                 */

                if (/^`{3,}mermaid/m.test(content)) {
                    const wasCollapsed =
                        !admonitionElement.hasAttribute("open");
                    if (admonitionElement instanceof HTMLDetailsElement) {
                        admonitionElement.setAttribute("open", "open");
                    }
                    setImmediate(() => {
                        MarkdownRenderer.renderMarkdown(
                            content,
                            admonitionContent,
                            sourcePath,
                            markdownRenderChild
                        );
                        if (
                            admonitionElement instanceof HTMLDetailsElement &&
                            wasCollapsed
                        ) {
                            admonitionElement.removeAttribute("open");
                        }
                    });
                } else {
                    MarkdownRenderer.renderMarkdown(
                        content,
                        admonitionContent,
                        sourcePath,
                        markdownRenderChild
                    );
                }

                if (admonition.copy ?? this.data.copyButton) {
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
                if (taskLists.length) {
                    const view =
                        this.app.workspace.getActiveViewOfType(MarkdownView);

                    if (view && view instanceof MarkdownView) {
                        const file = view.file;
                        const fileContent = view.currentMode.get();
                        const splitContent = src.split("\n");
                        let slicer = 0;
                        const start = fileContent.indexOf(src);
                        for (let i = 0; i < taskLists.length; i++) {
                            let tasks: NodeListOf<HTMLLIElement> =
                                taskLists[i].querySelectorAll(
                                    ".task-list-item"
                                );
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
                                const line = splitContent
                                    .slice(slicer)
                                    .find((str) =>
                                        new RegExp(
                                            `\\[.*\\]\\s*${task.innerText.replace(
                                                /[.*+?^${}()|[\]\\]/g,
                                                "\\$&"
                                            )}`
                                        ).test(str)
                                    );
                                slicer =
                                    slicer +
                                    splitContent.slice(slicer).indexOf(line) +
                                    1;

                                const lineNumber = slicer;

                                input.dataset["line"] = `${lineNumber}`;
                                input.onclick = async (evt) => {
                                    view.previewMode.renderer.onCheckboxClick(
                                        evt,
                                        input
                                    );
                                };
                            }
                        }
                    }
                }

                const links =
                    admonitionContent.querySelectorAll<HTMLAnchorElement>(
                        "a.internal-link"
                    );

                this.addLinksToCache(links, sourcePath);
            }

            /**
             * Replace the <pre> tag with the new admonition.
             */
            const parent = el.parentElement;
            if (parent && !parent.hasClass("admonition-content")) {
                parent.addClass(
                    "admonition-parent",
                    `admonition-${type}-parent`
                );
            }
            el.replaceWith(admonitionElement);
            return admonitionElement;
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
    getAdmonitionElement(
        type: string,
        title: string,
        icon: AdmonitionIconDefinition,
        color?: string,
        collapse?: string,
        id?: string
    ): HTMLElement {
        let admonition, titleEl;
        let attrs: { style?: string; open?: string } = color
            ? {
                  style: `--admonition-color: ${color};`
              }
            : {};
        if (collapse && collapse != "none") {
            if (collapse === "open") {
                attrs.open = "open";
            }
            admonition = createEl("details", {
                cls: `admonition admonition-${type} admonition-plugin`,
                attr: attrs
            });
            titleEl = admonition.createEl("summary", {
                cls: `admonition-title ${
                    !title?.trim().length ? "no-title" : ""
                }`
            });
        } else {
            admonition = createDiv({
                cls: `admonition admonition-${type} admonition-plugin`,
                attr: attrs
            });
            titleEl = admonition.createDiv({
                cls: `admonition-title ${
                    !title?.trim().length ? "no-title" : ""
                }`
            });
        }

        if (id) {
            admonition.id = id;
        }

        if (title && title.trim().length) {
            /**
             * Title structure
             * <div|summary>.admonition-title
             *      <element>.admonition-title-content - Rendered Markdown top-level element (e.g. H1/2/3 etc, p)
             *          div.admonition-title-icon
             *              svg
             *          div.admonition-title-markdown - Container of rendered markdown
             *              ...rendered markdown children...
             */

            //get markdown
            const markdownHolder = createDiv();
            MarkdownRenderer.renderMarkdown(title, markdownHolder, "", null);

            //admonition-title-content is first child of rendered markdown

            const admonitionTitleContent =
                markdownHolder.children[0]?.tagName === "P"
                    ? createDiv()
                    : markdownHolder.children[0];

            //get children of markdown element, then remove them
            const markdownElements = Array.from(
                markdownHolder.children[0]?.childNodes || []
            );
            admonitionTitleContent.innerHTML = "";
            admonitionTitleContent.addClass("admonition-title-content");

            //build icon element
            const iconEl = admonitionTitleContent.createDiv(
                "admonition-title-icon"
            );
            if (icon && icon.name && icon.type) {
                iconEl.appendChild(getIconNode(icon));
            }

            //add markdown children back
            const admonitionTitleMarkdown = admonitionTitleContent.createDiv(
                "admonition-title-markdown"
            );
            for (let i = 0; i < markdownElements.length; i++) {
                admonitionTitleMarkdown.appendChild(markdownElements[i]);
            }
            titleEl.appendChild(admonitionTitleContent || createDiv());
        }

        //add them to title element

        if (collapse) {
            titleEl.createDiv("collapser").createDiv("handle");
        }
        return admonition;
    }
    async getAdmonitionElementAsync(
        type: string,
        title: string,
        icon: AdmonitionIconDefinition,
        color?: string,
        collapse?: string,
        id?: string
    ): Promise<HTMLElement> {
        let admonition,
            titleEl,
            attrs: { style?: string; open?: string } = color
                ? {
                      style: `--admonition-color: ${color};`
                  }
                : {};
        if (collapse) {
            if (collapse === "open") {
                attrs.open = "open";
            }
            admonition = createEl("details", {
                cls: `admonition admonition-${type} admonition-plugin admonition-plugin-async`,
                attr: attrs
            });
            titleEl = admonition.createEl("summary", {
                cls: `admonition-title ${
                    !title.trim().length ? "no-title" : ""
                }`
            });
        } else {
            admonition = createDiv({
                cls: `admonition admonition-${type} admonition-plugin`,
                attr: attrs
            });
            titleEl = admonition.createDiv({
                cls: `admonition-title ${
                    !title.trim().length ? "no-title" : ""
                }`
            });
        }

        if (id) {
            admonition.id = id;
        }

        if (title && title.trim().length) {
            //
            // Title structure
            // <div|summary>.admonition-title
            //      <element>.admonition-title-content - Rendered Markdown top-level element (e.g. H1/2/3 etc, p)
            //          div.admonition-title-icon
            //              svg
            //          div.admonition-title-markdown - Container of rendered markdown
            //              ...rendered markdown children...
            //

            //get markdown
            if (this.data.parseTitles) {
                const markdownHolder = createDiv();
                await MarkdownRenderer.renderMarkdown(
                    title,
                    markdownHolder,
                    "",
                    null
                );

                //admonition-title-content is first child of rendered markdown

                const admonitionTitleContent =
                    markdownHolder.children[0].tagName === "P"
                        ? createDiv()
                        : markdownHolder.children[0];

                //get children of markdown element, then remove them
                const markdownElements = Array.from(
                    markdownHolder.children[0]?.childNodes || []
                );
                admonitionTitleContent.innerHTML = "";
                admonitionTitleContent.addClass("admonition-title-content");

                //build icon element
                const iconEl = admonitionTitleContent.createDiv(
                    "admonition-title-icon"
                );
                if (icon && icon.name && icon.type) {
                    iconEl.appendChild(getIconNode(icon));
                }

                //add markdown children back
                const admonitionTitleMarkdown =
                    admonitionTitleContent.createDiv(
                        "admonition-title-markdown"
                    );
                for (let i = 0; i < markdownElements.length; i++) {
                    admonitionTitleMarkdown.appendChild(markdownElements[i]);
                }
                titleEl.appendChild(admonitionTitleContent || createDiv());
            } else {
                titleEl.appendChild(createDiv({ text: title }));
            }
        }

        //add them to title element

        if (collapse) {
            titleEl.createDiv("collapser").createDiv("handle");
        }
        return admonition;
    }
}
