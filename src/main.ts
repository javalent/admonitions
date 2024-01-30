import {
    addIcon,
    Component,
    editorLivePreviewField,
    livePreviewState,
    MarkdownPostProcessor,
    MarkdownPostProcessorContext,
    MarkdownPreviewRenderer,
    MarkdownRenderChild,
    MarkdownRenderer,
    MarkdownView,
    Notice,
    Plugin,
    setIcon
} from "obsidian";

import {
    Admonition,
    AdmonitionSettings,
    AdmonitionIconDefinition
} from "./@types";
import {
    getParametersFromSource,
    SPIN_ICON,
    SPIN_ICON_NAME,
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
        customCss: {
            getSnippetPath(file: string): string;
            readSnippets(): void;
            setCssEnabledStatus(snippet: string, enabled: boolean): void;
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
    }
    namespace MarkdownPreviewRenderer {
        function unregisterCodeBlockPostProcessor(lang: string): void;
    }
    interface Editor {
        cm: {
            state: EditorState;
            focus: () => void;
            posAtDOM: (el: HTMLElement) => number;
            dispatch: (tr: TransactionSpec) => void;
        };
    }
}

import AdmonitionSetting from "./settings";
import { DownloadableIconPack, IconManager } from "./icons/manager";
import { InsertAdmonitionModal } from "./modal";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import CalloutManager from "./callout/manager";
import { AdmonitionSuggest } from "./suggest/suggest";
import { EditorState, TransactionSpec } from "@codemirror/state";

const DEFAULT_APP_SETTINGS: AdmonitionSettings = {
    userAdmonitions: {},
    syntaxHighlight: false,
    copyButton: false,
    version: "",
    autoCollapse: false,
    defaultCollapseType: "open",
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
    rpgDownloadedOnce: false,
    msDocConverted: false,
    useSnippet: false,
    snippetPath: `custom-admonitions.${[...Array(6).keys()]
        .map(() => ((16 * Math.random()) | 0).toString(16))
        .join("")}`
};

export default class ObsidianAdmonition extends Plugin {
    data: AdmonitionSettings;

    postprocessors: Map<string, MarkdownPostProcessor> = new Map();

    iconManager = new IconManager(this);
    calloutManager: CalloutManager;

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

        this.postprocessors = new Map();

        await this.loadSettings();
        await this.iconManager.load();
        this.app.workspace.onLayoutReady(async () => {
            this.addChild((this.calloutManager = new CalloutManager(this)));

            this.registerEditorSuggest(new AdmonitionSuggest(this));

            Object.keys(this.admonitions).forEach((type) => {
                this.registerType(type);
            });

            this.addSettingTab(new AdmonitionSetting(this.app, this));

            addIcon(ADD_COMMAND_NAME, ADD_ADMONITION_COMMAND_ICON);
            addIcon(REMOVE_COMMAND_NAME, REMOVE_ADMONITION_COMMAND_ICON);
            addIcon(WARNING_ICON_NAME, WARNING_ICON);
            addIcon(SPIN_ICON_NAME, SPIN_ICON);

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

                    let admonitions =
                        view.contentEl.querySelectorAll<HTMLElement>(
                            ".callout.is-collapsible:not(.is-collapsed)"
                        );
                    for (let i = 0; i < admonitions.length; i++) {
                        let admonition = admonitions[i];
                        this.calloutManager.collapse(admonition);
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

                    let admonitions =
                        view.contentEl.querySelectorAll<HTMLElement>(
                            ".callout.is-collapsible.is-collapsed"
                        );
                    for (let i = 0; i < admonitions.length; i++) {
                        let admonition = admonitions[i];

                        this.calloutManager.collapse(admonition);
                    }
                }
            });
            this.addCommand({
                id: "insert-admonition",
                name: "Insert Admonition",
                editorCallback: (editor, view) => {
                    let suggestor = new InsertAdmonitionModal(this);
                    suggestor.onClose = () => {
                        if (!suggestor.insert) return;
                        let titleLine = "",
                            collapseLine = "";
                        if (
                            suggestor.title.length &&
                            suggestor.title.toLowerCase() !=
                                suggestor.type.toLowerCase()
                        ) {
                            titleLine = `title: ${suggestor.title}\n`;
                        }
                        if (
                            (this.data.autoCollapse &&
                                suggestor.collapse !=
                                    this.data.defaultCollapseType) ||
                            (!this.data.autoCollapse &&
                                suggestor.collapse != "none")
                        ) {
                            collapseLine = `collapse: ${suggestor.collapse}\n`;
                        }
                        editor.getDoc().replaceSelection(
                            `\`\`\`ad-${
                                suggestor.type
                            }\n${titleLine}${collapseLine}
${editor.getDoc().getSelection()}
\`\`\`\n`
                        );
                        const cursor = editor.getCursor();
                        editor.setCursor(cursor.line - 3);
                    };
                    suggestor.open();
                }
            });
            this.addCommand({
                id: "insert-callout",
                name: "Insert Callout",
                editorCallback: (editor, view) => {
                    let suggestor = new InsertAdmonitionModal(this);
                    suggestor.onClose = () => {
                        if (!suggestor.insert) return;
                        let title = "",
                            collapse = "";
                        if (
                            (this.data.autoCollapse &&
                                suggestor.collapse !=
                                    this.data.defaultCollapseType) ||
                            (!this.data.autoCollapse &&
                                suggestor.collapse != "none")
                        ) {
                            switch (suggestor.collapse) {
                                case "open": {
                                    collapse = "+";
                                    break;
                                }
                                case "closed": {
                                    collapse = "-";
                                    break;
                                }
                            }
                        }
                        if (
                            suggestor.title.length &&
                            suggestor.title.toLowerCase() !=
                                suggestor.type.toLowerCase()
                        ) {
                            title = ` ${suggestor.title}`;
                        }
                        const selection = editor.getDoc().getSelection();
                        editor.getDoc().replaceSelection(
                            `> [!${suggestor.type}]${collapse}${title}
> ${selection.split("\n").join("\n> ")}
`
                        );
                    };
                    suggestor.open();
                }
            });
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
            let { title, collapse, content, icon, color, metadata } =
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
                collapse,
                sourcePath,
                metadata
            );
            this.renderAdmonitionContent(
                admonitionElement,
                type,
                content,
                ctx,
                sourcePath,
                src
            );
            if (collapse && collapse != "none") {
                this.calloutManager.setCollapsible(admonitionElement);
            }
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

            const view = app.workspace.getActiveViewOfType(MarkdownView);
            if (view?.editor?.cm?.state?.field(editorLivePreviewField)) {
                const editor = view.editor.cm;
                admonitionElement.onClickEvent((ev) => {
                    if (ev.defaultPrevented || ev.detail > 1 || ev.shiftKey)
                        return;
                    try {
                        setTimeout(() => {
                            try {
                                const pos = editor.posAtDOM(admonitionElement);
                                editor.focus();
                                editor.dispatch({
                                    selection: {
                                        head: pos,
                                        anchor: pos
                                    }
                                });
                            } catch (e) {}
                        }, 10);
                    } catch (e) {}
                });
            }

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

    /**
     *  .callout.admonition.is-collapsible.is-collapsed
     *      .callout-title
     *          .callout-icon
     *          .callout-title-inner
     *          .callout-fold
     *      .callout-content
     */
    getAdmonitionElement(
        type: string,
        title: string,
        icon: AdmonitionIconDefinition,
        color?: string,
        collapse?: string,
        source?: string,
        metadata?: string
    ): HTMLElement {
        const admonition = createDiv({
            cls: `callout admonition admonition-${type} admonition-plugin ${
                !title?.trim().length ? "no-title" : ""
            }`,
            attr: {
                style: color ? `--callout-color: ${color};` : "",
                "data-callout": type,
                "data-callout-fold": "",
                "data-callout-metadata": metadata ?? ""
            }
        });
        const titleEl = admonition.createDiv({
            cls: `callout-title admonition-title ${
                !title?.trim().length ? "no-title" : ""
            }`
        });

        if (title && title.trim().length) {
            //build icon element
            const iconEl = titleEl.createDiv(
                "callout-icon admonition-title-icon"
            );
            if (icon && icon.name && icon.type) {
                iconEl.appendChild(
                    this.iconManager.getIconNode(icon) ?? createDiv()
                );
            }

            //get markdown
            const titleInnerEl = titleEl.createDiv(
                "callout-title-inner admonition-title-content"
            );
            MarkdownRenderer.renderMarkdown(
                title,
                titleInnerEl,
                source ?? "",
                new Component()
            );
            if (
                titleInnerEl.firstElementChild &&
                titleInnerEl.firstElementChild instanceof HTMLParagraphElement
            ) {
                titleInnerEl.setChildrenInPlace(
                    Array.from(titleInnerEl.firstElementChild.childNodes)
                );
            }
        }

        //add them to title element

        if (collapse) {
            admonition.addClass("is-collapsible");
            if (collapse == "closed") {
                admonition.addClass("is-collapsed");
            }
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
        }
    }

    getAdmonitionContentElement(
        type: string,
        admonitionElement: HTMLElement,
        content: string
    ) {
        const contentEl = admonitionElement.createDiv(
            "callout-content admonition-content"
        );
        if (this.admonitions[type].copy ?? this.data.copyButton) {
            let copy = contentEl.createDiv("admonition-content-copy");
            setIcon(copy, "copy");
            copy.addEventListener("click", () => {
                navigator.clipboard.writeText(content.trim()).then(async () => {
                    new Notice("Admonition content copied to clipboard.");
                });
            });
        }
        return contentEl;
    }

    registerType(type: string) {
        /** Turn on CodeMirror syntax highlighting for this "language" */
        if (this.data.syntaxHighlight) {
            this.turnOnSyntaxHighlighting([type]);
        }

        /** Register an admonition code-block post processor for legacy support. */
        if (this.postprocessors.has(type)) {
            MarkdownPreviewRenderer.unregisterCodeBlockPostProcessor(
                `ad-${type}`
            );
        }
        this.postprocessors.set(
            type,
            this.registerMarkdownCodeBlockProcessor(
                `ad-${type}`,
                (src, el, ctx) => this.postprocessor(type, src, el, ctx)
            )
        );
        const admonition = this.admonitions[type];
        if (admonition.command) {
            this.registerCommandsFor(admonition);
        }
    }
    get admonitions() {
        return { ...ADMONITION_MAP, ...this.data.userAdmonitions };
    }
    async addAdmonition(admonition: Admonition): Promise<void> {
        this.data.userAdmonitions = {
            ...this.data.userAdmonitions,
            [admonition.type]: admonition
        };

        this.registerType(admonition.type);

        /** Create the admonition type in CSS */
        this.calloutManager.addAdmonition(admonition);

        await this.saveSettings();
    }
    registerCommandsFor(admonition: Admonition) {
        admonition.command = true;
        this.addCommand({
            id: `insert-${admonition.type}-callout`,
            name: `Insert ${admonition.type} Callout`,
            editorCheckCallback: (checking, editor, view) => {
                if (checking) return admonition.command;
                if (admonition.command) {
                    try {
                        const selection = editor.getDoc().getSelection();
                        editor.getDoc().replaceSelection(
                            `> [!${admonition.type}]
> ${selection.split("\n").join("\n> ")}
`
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
    unregisterType(admonition: Admonition) {
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
            MarkdownPreviewRenderer.unregisterCodeBlockPostProcessor(
                `ad-${admonition.type}`
            );
            this.postprocessors.delete(admonition.type);
        }
    }
    async removeAdmonition(admonition: Admonition) {
        if (this.data.userAdmonitions[admonition.type]) {
            delete this.data.userAdmonitions[admonition.type];
        }

        this.unregisterType(admonition);

        /** Remove the admonition type in CSS */
        this.calloutManager.removeAdmonition(admonition);

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
        this.postprocessors = null;
        this.turnOffSyntaxHighlighting();
    }
}
