import {
    FuzzyMatch,
    Modal,
    Notice,
    SearchComponent,
    Setting,
    TextComponent,
    renderMatches,
    setIcon
} from "obsidian";

import { FuzzyInputSuggest } from "@javalent/utilities";

import { Admonition, AdmonitionIconDefinition } from "src/@types";
import ObsidianAdmonition from "src/main";

export class IconSuggestionModal extends FuzzyInputSuggest<AdmonitionIconDefinition> {
    constructor(
        public plugin: ObsidianAdmonition,
        input: TextComponent | SearchComponent,
        items: AdmonitionIconDefinition[]
    ) {
        super(plugin.app, input, items);
    }
    renderNote(
        noteEL: HTMLElement,
        result: FuzzyMatch<AdmonitionIconDefinition>
    ): void {
        noteEL.setText(this.plugin.iconManager.getIconModuleName(result.item));
    }
    renderTitle(
        titleEl: HTMLElement,
        result: FuzzyMatch<AdmonitionIconDefinition>
    ): void {
        renderMatches(titleEl, result.item.name, result.match.matches);
    }
    renderFlair(
        flairEl: HTMLElement,
        result: FuzzyMatch<AdmonitionIconDefinition>
    ): void {
        const { item } = result;

        flairEl.appendChild(
            this.plugin.iconManager.getIconNode(item) ?? createDiv()
        );
    }

    getItemText(item: AdmonitionIconDefinition) {
        return item.name;
    }
}
class AdmonitionSuggestionModal extends FuzzyInputSuggest<Admonition> {
    constructor(
        public plugin: ObsidianAdmonition,
        input: TextComponent | SearchComponent,
        items: Admonition[]
    ) {
        super(plugin.app, input, items);
    }
    renderTitle(titleEl: HTMLElement, result: FuzzyMatch<Admonition>): void {
        renderMatches(titleEl, result.item.type, result.match.matches);
    }
    renderFlair(flairEl: HTMLElement, result: FuzzyMatch<Admonition>): void {
        const { item } = result;
        flairEl
            .appendChild(
                this.plugin.iconManager.getIconNode(item.icon) ?? createDiv()
            )
            .setAttribute("color", `rgb(${item.color})`);
    }
    getItemText(item: Admonition) {
        return item.type;
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
    insert: boolean;
    constructor(private plugin: ObsidianAdmonition) {
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
                this.plugin,
                t,
                this.plugin.admonitionArray
            );

            const build = () => {
                if (
                    t.inputEl.value &&
                    this.plugin.admonitions[t.inputEl.value]
                ) {
                    this.type = t.inputEl.value;
                    this.title = this.plugin.admonitions[this.type].title;
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

            modal.onSelect((item) => {
                t.inputEl.value = item.item.type;
                build();
                modal.close();
            });
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
                        const admonition = this.plugin.admonitions[this.type];
                        const element = this.plugin.getAdmonitionElement(
                            this.type,
                            this.title,
                            admonition.icon,
                            admonition.injectColor ??
                                this.plugin.data.injectColor
                                ? admonition.color
                                : null,
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
                        this.insert = true;
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
            const admonition = this.plugin.admonitions[this.type];
            this.element = this.plugin.getAdmonitionElement(
                this.type,
                this.title,
                admonition.icon,
                admonition.injectColor ?? this.plugin.data.injectColor
                    ? admonition.color
                    : null,
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
