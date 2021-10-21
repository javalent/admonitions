import {
    App,
    Editor,
    FuzzyMatch,
    FuzzySuggestModal,
    Modal,
    Notice,
    Platform,
    Scope,
    Setting,
    SuggestModal,
    TextComponent
} from "obsidian";
import { createPopper, Instance as PopperInstance } from "@popperjs/core";

import {
    getAdmonitionElement,
    getIconModuleName,
    getIconNode,
    iconDefinitions
} from "../util";
import {
    Admonition,
    AdmonitionIconDefinition,
    ObsidianAdmonitionPlugin
} from "src/@types";

class Suggester<T> {
    owner: SuggestModal<T>;
    items: T[];
    suggestions: HTMLDivElement[];
    selectedItem: number;
    containerEl: HTMLElement;
    constructor(
        owner: SuggestModal<T>,
        containerEl: HTMLElement,
        scope: Scope
    ) {
        this.containerEl = containerEl;
        this.owner = owner;
        containerEl.on(
            "click",
            ".suggestion-item",
            this.onSuggestionClick.bind(this)
        );
        containerEl.on(
            "mousemove",
            ".suggestion-item",
            this.onSuggestionMouseover.bind(this)
        );

        scope.register([], "ArrowUp", () => {
            this.setSelectedItem(this.selectedItem - 1, true);
            return false;
        });

        scope.register([], "ArrowDown", () => {
            this.setSelectedItem(this.selectedItem + 1, true);
            return false;
        });

        scope.register([], "Enter", (evt) => {
            this.useSelectedItem(evt);
            return false;
        });

        scope.register([], "Tab", (evt) => {
            this.useSelectedItem(evt);
            return false;
        });
    }
    chooseSuggestion(evt: KeyboardEvent | MouseEvent) {
        if (!this.items || !this.items.length) return;
        const currentValue = this.items[this.selectedItem];
        if (currentValue) {
            this.owner.selectSuggestion(currentValue, evt);
        }
    }
    onSuggestionClick(event: MouseEvent, el: HTMLDivElement): void {
        event.preventDefault();
        if (!this.suggestions || !this.suggestions.length) return;

        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
        this.useSelectedItem(event);
    }

    onSuggestionMouseover(event: MouseEvent, el: HTMLDivElement): void {
        if (!this.suggestions || !this.suggestions.length) return;
        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
    }
    empty() {
        this.containerEl.empty();
    }
    setSuggestions(items: T[]) {
        this.containerEl.empty();
        const els: HTMLDivElement[] = [];

        items.forEach((item) => {
            const suggestionEl = this.containerEl.createDiv("suggestion-item");
            this.owner.renderSuggestion(item, suggestionEl);
            els.push(suggestionEl);
        });
        this.items = items;
        this.suggestions = els;
        this.setSelectedItem(0, false);
    }
    useSelectedItem(event: MouseEvent | KeyboardEvent) {
        if (!this.items || !this.items.length) return;
        const currentValue = this.items[this.selectedItem];
        if (currentValue) {
            this.owner.selectSuggestion(currentValue, event);
        }
        if (Platform.isMobile) {
            this.chooseSuggestion(event);
        }
    }
    wrap(value: number, size: number): number {
        return ((value % size) + size) % size;
    }
    setSelectedItem(index: number, scroll: boolean) {
        const nIndex = this.wrap(index, this.suggestions.length);
        const prev = this.suggestions[this.selectedItem];
        const next = this.suggestions[nIndex];

        if (prev) prev.removeClass("is-selected");
        if (next) next.addClass("is-selected");

        this.selectedItem = nIndex;

        if (scroll) {
            next.scrollIntoView(false);
        }
    }
}

export abstract class SuggestionModal<T> extends FuzzySuggestModal<T> {
    items: T[] = [];
    suggestions: HTMLDivElement[];
    popper: PopperInstance;
    scope: Scope = new Scope();
    suggester: Suggester<FuzzyMatch<T>>;
    suggestEl: HTMLDivElement;
    promptEl: HTMLDivElement;
    emptyStateText: string = "No match found";
    limit: number = 100;
    constructor(app: App, inputEl: HTMLInputElement, items: T[]) {
        super(app);
        this.inputEl = inputEl;
        this.items = items;

        this.suggestEl = createDiv("suggestion-container");

        this.contentEl = this.suggestEl.createDiv("suggestion");

        this.suggester = new Suggester(this, this.contentEl, this.scope);

        this.scope.register([], "Escape", this.close.bind(this));

        this.inputEl.addEventListener("input", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("focus", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("blur", this.close.bind(this));
        this.suggestEl.on(
            "mousedown",
            ".suggestion-container",
            (event: MouseEvent) => {
                event.preventDefault();
            }
        );
    }
    empty() {
        this.suggester.empty();
    }
    onInputChanged(): void {
        const inputStr = this.modifyInput(this.inputEl.value);
        const suggestions = this.getSuggestions(inputStr);
        if (suggestions.length > 0) {
            this.suggester.setSuggestions(suggestions.slice(0, this.limit));
        } else {
            this.onNoSuggestion();
        }
        this.open();
    }

    modifyInput(input: string): string {
        return input;
    }
    onNoSuggestion() {
        this.empty();
        this.renderSuggestion(
            null,
            this.contentEl.createDiv("suggestion-item")
        );
    }
    open(): void {
        // TODO: Figure out a better way to do this. Idea from Periodic Notes plugin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>this.app).keymap.pushScope(this.scope);

        document.body.appendChild(this.suggestEl);
        this.popper = createPopper(this.inputEl, this.suggestEl, {
            placement: "bottom-start",
            modifiers: [
                {
                    name: "offset",
                    options: {
                        offset: [0, 10]
                    }
                },
                {
                    name: "flip",
                    options: {
                        fallbackPlacements: ["top"]
                    }
                }
            ]
        });
    }

    close(): void {
        // TODO: Figure out a better way to do this. Idea from Periodic Notes plugin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>this.app).keymap.popScope(this.scope);

        this.suggester.setSuggestions([]);
        if (this.popper) {
            this.popper.destroy();
        }

        this.suggestEl.detach();
    }
    createPrompt(prompts: HTMLSpanElement[]) {
        if (!this.promptEl)
            this.promptEl = this.suggestEl.createDiv("prompt-instructions");
        let prompt = this.promptEl.createDiv("prompt-instruction");
        for (let p of prompts) {
            prompt.appendChild(p);
        }
    }
    abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;
    abstract getItemText(arg: T): string;
    abstract getItems(): T[];
}

export class IconSuggestionModal extends SuggestionModal<AdmonitionIconDefinition> {
    icons: AdmonitionIconDefinition[];
    icon: AdmonitionIconDefinition;
    text: TextComponent;
    constructor(app: App, input: TextComponent) {
        super(app, input.inputEl, iconDefinitions);
        this.icons = iconDefinitions;
        this.text = input;

        this.createPrompts();

        this.inputEl.addEventListener("input", this.getItem.bind(this));
    }
    createPrompts() {}
    getItem() {
        const v = this.inputEl.value,
            icon = this.icons.find((iconName) => iconName.name === v.trim());
        if (icon == this.icon) return;
        this.icon = icon;
        if (this.icons) this.onInputChanged();
    }
    getItemText(item: AdmonitionIconDefinition) {
        return item.name;
    }
    onChooseItem(item: AdmonitionIconDefinition) {
        this.text.setValue(item.name);
        this.icon = item;
    }
    selectSuggestion({ item }: FuzzyMatch<AdmonitionIconDefinition>) {
        this.text.setValue(item.name);
        this.icon = item;
        this.onClose();

        this.close();
    }
    renderSuggestion(
        result: FuzzyMatch<AdmonitionIconDefinition>,
        el: HTMLElement
    ) {
        let { item, match: matches } = result || {};
        let content = el.createDiv({
            cls: "suggestion-content admonition-icon"
        });
        let text = content.createDiv("suggestion-text admonition-text");
        if (!item) {
            content.setText(this.emptyStateText);
            content.parentElement.addClass("is-selected");
            return;
        }

        const matchElements = matches.matches.map((m) => {
            return createSpan("suggestion-highlight");
        });
        for (let i = 0; i < item.name.length; i++) {
            let match = matches.matches.find((m) => m[0] === i);
            if (match) {
                let element = matchElements[matches.matches.indexOf(match)];
                text.appendChild(element);
                element.appendText(item.name.substring(match[0], match[1]));

                i += match[1] - match[0] - 1;
                continue;
            }

            text.appendText(item.name[i]);
        }

        const iconDiv = createDiv("suggestion-flair admonition-suggester-icon");
        iconDiv.appendChild(getIconNode(item));
        content.appendChild(iconDiv);
        content.createDiv({
            cls: "suggestion-note",
            text: getIconModuleName(item)
        });
    }
    getItems() {
        return this.icons;
    }
}
class AdmonitionSuggestionModal extends SuggestionModal<Admonition> {
    admonitions: Admonition[];
    admonition: Admonition;
    text: TextComponent;
    constructor(app: App, input: TextComponent, items: Admonition[]) {
        super(app, input.inputEl, items);
        this.admonitions = [...items];
        this.text = input;

        this.createPrompts();

        this.inputEl.addEventListener("input", this.getItem.bind(this));
    }
    createPrompts() {}
    getItem() {
        const v = this.inputEl.value,
            admonition = this.admonitions.find(
                (admonition) => admonition.type === v.trim()
            );
        if (admonition == this.admonition) return;
        this.admonition = admonition;
        if (this.admonitions) this.onInputChanged();
    }
    getItemText(item: Admonition) {
        return item.type;
    }
    onChooseItem(item: Admonition) {
        this.text.setValue(item.type);
        this.admonition = item;
    }
    selectSuggestion({ item }: FuzzyMatch<Admonition>) {
        this.text.setValue(item.type);
        this.onClose();
        this.close();
    }
    renderSuggestion(result: FuzzyMatch<Admonition>, el: HTMLElement) {
        let { item, match: matches } = result || {};
        let content = el.createDiv({
            cls: "suggestion-content icon"
        });
        if (!item) {
            content.setText(this.emptyStateText);
            content.parentElement.addClass("is-selected");
            return;
        }

        const matchElements = matches.matches.map((m) => {
            return createSpan("suggestion-highlight");
        });
        for (let i = 0; i < item.type.length; i++) {
            let match = matches.matches.find((m) => m[0] === i);
            if (match) {
                let element = matchElements[matches.matches.indexOf(match)];
                content.appendChild(element);
                element.appendText(item.type.substring(match[0], match[1]));

                i += match[1] - match[0] - 1;
                continue;
            }

            content.appendText(item.type[i]);
        }

        const iconDiv = createDiv("suggestion-flair admonition-suggester-icon");
        iconDiv
            .appendChild(getIconNode(item.icon))
            .setAttribute("color", `rgb(${item.color})`);

        content.prepend(iconDiv);
    }
    getItems() {
        return this.admonitions;
    }
}

export class InsertAdmonitionModal extends Modal {
    public type: string;
    public title: string;
    public noTitle: boolean;
    public collapse: "open" | "closed" | "none" = this.plugin.data.autoCollapse
        ? this.plugin.data.defaultCollapseType
        : "none";
    private element: HTMLElement;
    admonitionEl: HTMLDivElement;
    constructor(
        private plugin: ObsidianAdmonitionPlugin,
        private editor: Editor
    ) {
        super(plugin.app);

        this.containerEl.addClass("insert-admonition-modal");

        this.onOpen = () => this.display(true);
    }
    private async display(focus?: boolean) {
        const { contentEl } = this;

        contentEl.empty();

        const typeSetting = new Setting(contentEl);
        typeSetting.setName("Admonition Type").addText((t) => {
            t.setPlaceholder("Admonition Type").setValue(this.type);
            const modal = new AdmonitionSuggestionModal(
                this.app,
                t,
                this.plugin.admonitionArray
            );

            const build = () => {
                if (
                    t.inputEl.value &&
                    this.plugin.admonitions[t.inputEl.value]
                ) {
                    this.type = t.inputEl.value;
                    if (!this.title?.length) {
                        this.title =
                            this.type[0].toUpperCase() +
                            this.type.slice(1).toLowerCase();
                    }
                    titleInput.setValue(this.title);
                } else {
                    new Notice("No admonition type by that name exists.");
                    t.inputEl.value = "";
                }

                this.buildAdmonition();
            };

            t.inputEl.onblur = build;

            modal.onClose = build;
            if (focus) {
                modal.open();
                t.inputEl.focus();
            }
        });

        let titleInput: TextComponent;

        const titleSetting = new Setting(contentEl);
        titleSetting
            .setName("Admonition Title")
            .setDesc("Leave blank to render without a title.")
            .addText((t) => {
                titleInput = t;
                t.setValue(this.title);

                t.onChange((v) => {
                    this.title = v;
                    if (v.length == 0) {
                        this.noTitle = true;
                    } else {
                        this.noTitle = false;
                    }
                    if (this.element) {
                        const element = getAdmonitionElement(
                            this.type,
                            this.title,
                            this.plugin.admonitions[this.type].icon,
                            this.plugin.admonitions[this.type].color,
                            this.collapse
                        );
                        element.createDiv({
                            cls: "admonition-content",
                            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla."
                        });
                        this.element.replaceWith(element);
                        this.element = element;
                    }
                });
            });

        const collapseSetting = new Setting(contentEl);
        collapseSetting.setName("Make Collapsible").addDropdown((d) => {
            d.addOption("open", "Open");
            d.addOption("closed", "Closed");
            d.addOption("none", "None");
            d.setValue(this.collapse);
            d.onChange((v: "open" | "closed" | "none") => {
                this.collapse = v;
                this.buildAdmonition();
            });
        });

        this.admonitionEl = this.contentEl.createDiv();
        this.buildAdmonition();

        new Setting(contentEl)
            .addButton((b) =>
                b
                    .setButtonText("Insert")
                    .setCta()
                    .onClick(() => {
                        try {
                            let titleLine = "",
                                collapseLine = "";
                            if (
                                this.title.length &&
                                this.title.toLowerCase() !=
                                    this.type.toLowerCase()
                            ) {
                                titleLine = `title: ${this.title}\n`;
                            }
                            if (
                                (this.plugin.data.autoCollapse &&
                                    this.collapse !=
                                        this.plugin.data.defaultCollapseType) ||
                                (!this.plugin.data.autoCollapse &&
                                    this.collapse != "none")
                            ) {
                                collapseLine = `collapse: ${this.collapse}\n`;
                            }
                            this.editor.getDoc().replaceSelection(
                                `\`\`\`ad-${
                                    this.type
                                }\n${titleLine}${collapseLine}
${this.editor.getDoc().getSelection()}

\`\`\`\n`
                            );
                            const cursor = this.editor.getCursor();
                            this.editor.setCursor(cursor.line - 3);
                        } catch (e) {
                            new Notice(
                                "There was an issue inserting the admonition."
                            );
                        }
                        this.close();
                    })
            )
            .addExtraButton((b) => {
                b.setIcon("cross")
                    .setTooltip("Cancel")
                    .onClick(() => this.close());
                b.extraSettingsEl.setAttr("tabindex", 0);
                b.extraSettingsEl.onkeydown = (evt) => {
                    evt.key == "Enter" && this.close();
                };
            });
    }
    buildAdmonition() {
        this.admonitionEl.empty();
        if (this.type && this.plugin.admonitions[this.type]) {
            this.element = getAdmonitionElement(
                this.type,
                this.title,
                this.plugin.admonitions[this.type].icon,
                this.plugin.admonitions[this.type].color,
                this.collapse
            );
            this.element.createDiv({
                cls: "admonition-content",
                text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla."
            });
            this.admonitionEl.appendChild(this.element);
        }
    }
}
