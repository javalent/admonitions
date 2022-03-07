import {
    addIcon,
    MarkdownPostProcessor,
    MarkdownPostProcessorContext,
    MarkdownPreviewRenderer,
    MarkdownRenderChild,
    MarkdownRenderer,
    MarkdownView,
    Notice,
    Plugin,
    setIcon,
    TFile
} from "obsidian";

import { syntaxTree } from "@codemirror/language";
import {
    ViewPlugin,
    DecorationSet,
    EditorView,
    ViewUpdate,
    Decoration,
    WidgetType
} from "@codemirror/view";

import { tokenClassNodeProp } from "@codemirror/stream-parser";
import { Range } from "@codemirror/rangeset";
import { StateEffect, StateField } from "@codemirror/state";

import {
    Admonition,
    AdmonitionSettings,
    AdmonitionIconDefinition
} from "./@types";
import {
    COPY_ICON,
    COPY_ICON_NAME,
    getParametersFromSource,
    MSDOCREGEX,
    WARNING_ICON,
    WARNING_ICON_NAME
} from "./util";
import {
    ADMONITION_MAP,
    ADD_ADMONITION_COMMAND_ICON,
    REMOVE_ADMONITION_COMMAND_ICON,
    ADD_COMMAND_NAME,
    REMOVE_COMMAND_NAME
} from "./util";

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
            executeCommandById(id: string): void;
            listCommands(): Command[];
            executeCommandById(id: string): void;
            findCommand(id: string): Command;
        };
        plugins: {
            getPluginFolder(): string;
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

import AdmonitionSetting from "./settings";
import { DownloadableIconPack, IconManager } from "./icons/manager";
import { InsertAdmonitionModal } from "./modal";
import "./assets/main.css";
import { isLivePreview, rangesInclude } from "./util";
import { IconName } from "@fortawesome/fontawesome-svg-core";

const DEFAULT_APP_SETTINGS: AdmonitionSettings = {
    userAdmonitions: {},
    syntaxHighlight: false,
    copyButton: false,
    version: "",
    autoCollapse: false,
    defaultCollapseType: "open",
    syncLinks: true,
    injectColor: true,
    parseTitles: true,
    dropShadow: true,
    hideEmpty: false,
    open: {
        admonitions: true,
        icons: true,
        other: true,
        advanced: false
    },
    icons: [],
    useFontAwesome: true,
    rpgDownloadedOnce: false
};

export default class ObsidianAdmonition extends Plugin {
    admonitions: { [admonitionType: string]: Admonition } = {};
    data: AdmonitionSettings;

    postprocessors: Map<string, MarkdownPostProcessor> = new Map();

    iconManager = new IconManager(this);

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

    async onload(): Promise<void> {
        console.log("Obsidian Admonition loaded");

        await this.loadSettings();
        await this.iconManager.load();
        this.app.workspace.onLayoutReady(async () => {
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

            this.addSettingTab(new AdmonitionSetting(this.app, this));

            addIcon(ADD_COMMAND_NAME, ADD_ADMONITION_COMMAND_ICON);
            addIcon(REMOVE_COMMAND_NAME, REMOVE_ADMONITION_COMMAND_ICON);
            addIcon(WARNING_ICON_NAME, WARNING_ICON);
            addIcon(COPY_ICON_NAME, COPY_ICON);

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
                    let view =
                        this.app.workspace.getActiveViewOfType(MarkdownView);
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
                    let view =
                        this.app.workspace.getActiveViewOfType(MarkdownView);
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
        });
    }
    async downloadIcon(pack: DownloadableIconPack) {
        this.iconManager.downloadIcon(pack);
    }

    async removeIcon(pack: DownloadableIconPack) {
        this.iconManager.removeIcon(pack);
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

            if (this.data.autoCollapse && !collapse) {
                collapse = this.data.defaultCollapseType ?? "open";
            } else if (collapse && collapse.trim() === "none") {
                collapse = "";
            }

            /* const iconNode = icon ? this.admonitions[type].icon; */
            const admonition = this.admonitions[type];
            let admonitionElement = this.getAdmonitionElement(
                type,
                title,
                this.iconManager.iconDefinitions.find(
                    ({ name }) => icon === name
                ) ?? admonition.icon,
                color ??
                    (admonition.injectColor ?? this.data.injectColor
                        ? admonition.color
                        : null),
                collapse
            );
            this.renderAdmonitionContent(
                admonitionElement,
                type,
                content,
                ctx,
                sourcePath,
                src
            );
            /**
             * Replace the <pre> tag with the new admonition.
             */
            const parent = el.parentElement;
            if (parent) {
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

    getMSParametersFromLine(line: string) {
        let [, type, title, col] = line.match(MSDOCREGEX) ?? [];

        if (
            !type ||
            (!this.admonitions[type] &&
                !Object.keys(this.admonitions)
                    .map((k) => k.toLowerCase())
                    .includes(type.toLowerCase()))
        )
            return;

        if (!(type in this.admonitions)) {
            type = Object.keys(this.admonitions).find(
                (k) => k.toLowerCase() == type.toLowerCase()
            );
        }
        if (!type) return;

        if (title == undefined && !line.match(/^> \[!(\w+):[ ]?/)) {
            title =
                this.admonitions[type].title ??
                `${type[0].toUpperCase()}${type.slice(1).toLowerCase()}`;
        }

        let collapse;
        switch (col) {
            case "+": {
                collapse = "open";
                break;
            }
            case "-": {
                collapse = "closed";
                break;
            }
            case "x": {
                break;
            }
            default: {
                collapse = this.data.autoCollapse
                    ? this.data.defaultCollapseType
                    : null;
            }
        }
        if ((collapse == "closed" || collapse == "open") && !title) {
            title =
                this.admonitions[type].title ??
                `${type[0].toUpperCase()}${type.slice(1).toLowerCase()}`;
        }
        return { type, title, collapse };
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
        collapse?: string
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
                cls: `admonition admonition-${type} admonition-plugin ${
                    !title?.trim().length ? "no-title" : ""
                }`,
                attr: attrs
            });
            titleEl = admonition.createEl("summary", {
                cls: `admonition-title ${
                    !title?.trim().length ? "no-title" : ""
                }`
            });
        } else {
            admonition = createDiv({
                cls: `admonition admonition-${type} admonition-plugin ${
                    !title?.trim().length ? "no-title" : ""
                }`,
                attr: attrs
            });
            titleEl = admonition.createDiv({
                cls: `admonition-title ${
                    !title?.trim().length ? "no-title" : ""
                }`
            });
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
                iconEl.appendChild(
                    this.iconManager.getIconNode(icon) ?? createDiv()
                );
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
        if (!this.data.dropShadow) {
            admonition.addClass("no-drop");
        }
        return admonition;
    }

    renderAdmonitionContent(
        admonitionElement: HTMLElement,
        type: string,
        content: string,
        ctx: MarkdownPostProcessorContext,
        sourcePath: string,
        src: string
    ) {
        let markdownRenderChild = new MarkdownRenderChild(admonitionElement);
        markdownRenderChild.containerEl = admonitionElement;
        if (ctx && !(typeof ctx == "string")) {
            ctx.addChild(markdownRenderChild);
        }

        if (content && content?.trim().length) {
            /**
             * Render the content as markdown and append it to the admonition.
             */
            const contentEl = this.getAdmonitionContentElement(
                type,
                admonitionElement,
                content
            );
            if (/^`{3,}mermaid/m.test(content)) {
                const wasCollapsed = !admonitionElement.hasAttribute("open");
                if (admonitionElement instanceof HTMLDetailsElement) {
                    admonitionElement.setAttribute("open", "open");
                }
                setImmediate(() => {
                    MarkdownRenderer.renderMarkdown(
                        content,
                        contentEl,
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
                    contentEl,
                    sourcePath,
                    markdownRenderChild
                );
            }

            if (
                (!content.length || contentEl.textContent.trim() == "") &&
                this.data.hideEmpty
            )
                admonitionElement.addClass("no-content");

            const taskLists = contentEl.querySelectorAll<HTMLInputElement>(
                ".task-list-item-checkbox"
            );
            if (taskLists?.length) {
                const split = src.split("\n");
                let slicer = 0;
                taskLists.forEach((task) => {
                    const line = split
                        .slice(slicer)
                        .findIndex((l) => /^[ \t>]*\- \[.\]/.test(l));

                    if (line == -1) return;
                    task.dataset.line = `${line + slicer + 1}`;
                    slicer = line + slicer + 1;
                });
            }

            const links =
                contentEl.querySelectorAll<HTMLAnchorElement>(
                    "a.internal-link"
                );

            this.addLinksToCache(links, sourcePath);
        }
    }

    getAdmonitionContentElement(
        type: string,
        admonitionElement: HTMLElement,
        content: string
    ) {
        const contentHolder = admonitionElement.createDiv(
            "admonition-content-holder"
        );
        const contentEl = contentHolder.createDiv("admonition-content");
        if (this.admonitions[type].copy ?? this.data.copyButton) {
            let copy = contentHolder.createDiv("admonition-content-copy");
            setIcon(copy, COPY_ICON_NAME);
            copy.addEventListener("click", () => {
                navigator.clipboard.writeText(content.trim()).then(async () => {
                    new Notice("Admonition content copied to clipboard.");
                });
            });
        }
        return contentEl;
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

${editor.getDoc().getSelection()}

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
                        const title = admonition.title ?? "";
                        editor.getDoc().replaceSelection(
                            `\`\`\`ad-${admonition.type}
title: ${title}

${editor.getDoc().getSelection()}

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

    async saveSettings() {
        this.data.version = this.manifest.version;

        await this.saveData(this.data);
    }
    async loadSettings() {
        const loaded: AdmonitionSettings = await this.loadData();
        this.data = Object.assign({}, DEFAULT_APP_SETTINGS, loaded);

        if (this.data.userAdmonitions) {
            if (
                !this.data.version ||
                Number(this.data.version.split(".")[0]) < 5
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

            if (
                !this.data.version ||
                Number(this.data.version.split(".")[0]) < 8
            ) {
                new Notice(
                    createFragment((e) => {
                        e.createSpan({
                            text: "Admonitions: Obsidian now has native support for callouts! Check out the "
                        });

                        e.createEl("a", {
                            text: "Admonitions ReadMe",
                            href: "obsidian://show-plugin?id=obsidian-admonition"
                        });

                        e.createSpan({
                            text: " for what that means for Admonitions going forward."
                        });
                    }),
                    0
                );
            }
        }

        if (
            !this.data.rpgDownloadedOnce &&
            this.data.userAdmonitions &&
            Object.values(this.data.userAdmonitions).some((admonition) => {
                if (admonition.icon.type == "rpg") return true;
            }) &&
            !this.data.icons.includes("rpg")
        ) {
            try {
                await this.downloadIcon("rpg");
                this.data.rpgDownloadedOnce = true;
            } catch (e) {}
        }

        this.admonitions = {
            ...ADMONITION_MAP,
            ...this.data.userAdmonitions
        };
        await this.saveSettings();
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

        this.app.workspace.onLayoutReady(() =>
            this.app.workspace.iterateCodeMirrors((cm) =>
                cm.setOption("mode", cm.getOption("mode"))
            )
        );
    }
    turnOffSyntaxHighlighting(types: string[] = Object.keys(this.admonitions)) {
        types.forEach((type) => {
            if (window.CodeMirror.modes.hasOwnProperty(`ad-${type}`)) {
                delete window.CodeMirror.modes[`ad-${type}`];
            }
        });
        this.app.workspace.onLayoutReady(() =>
            this.app.workspace.iterateCodeMirrors((cm) =>
                cm.setOption("mode", cm.getOption("mode"))
            )
        );
    }

    async onunload() {
        console.log("Obsidian Admonition unloaded");

        this.turnOffSyntaxHighlighting();
    }
}
