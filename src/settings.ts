import {
    PluginSettingTab,
    Setting,
    App,
    ButtonComponent,
    Modal,
    TextComponent,
    Notice,
    setIcon
} from "obsidian";
import {
    Admonition,
    AdmonitionIconDefinition,
    AdmonitionIconName,
    AdmonitionIconType
} from "./@types";

import {
    ADD_COMMAND_NAME,
    REMOVE_COMMAND_NAME,
    WARNING_ICON_NAME
} from "./util";

import { IconSuggestionModal } from "./modal";

//@ts-expect-error
import CONTENT from "../publish/publish.admonition.txt";

import { t } from "src/lang/helpers";
import ObsidianAdmonition from "./main";
import { confirmWithModal } from "./modal/confirm";
import { DownloadableIconPack, DownloadableIcons } from "./icons/packs";

/** Taken from https://stackoverflow.com/questions/34849001/check-if-css-selector-is-valid/42149818 */
const isSelectorValid = ((dummyElement) => (selector: string) => {
    try {
        dummyElement.querySelector(selector);
    } catch {
        return false;
    }
    return true;
})(document.createDocumentFragment());

export default class AdmonitionSetting extends PluginSettingTab {
    additionalEl: HTMLDivElement;
    constructor(app: App, public plugin: ObsidianAdmonition) {
        super(app, plugin);
    }
    async display(): Promise<void> {
        this.containerEl.empty();
        this.containerEl.addClass("admonition-settings");
        this.containerEl.createEl("h2", { text: t("Admonition Settings") });

        const admonitionEl = this.containerEl.createDiv(
            "admonitions-nested-settings"
        );
        new Setting(admonitionEl)
            .setName(t("Add New"))
            .setDesc(t("Add a new Admonition type."))
            .addButton((button: ButtonComponent): ButtonComponent => {
                let b = button
                    .setTooltip(t("Add Additional"))
                    .setButtonText("+")
                    .onClick(async () => {
                        let modal = new SettingsModal(this.plugin);

                        modal.onClose = async () => {
                            if (modal.saved) {
                                this.plugin.addAdmonition({
                                    type: modal.type,
                                    color: modal.color,
                                    icon: modal.icon,
                                    command: false,
                                    title: modal.title,
                                    injectColor: modal.injectColor,
                                    noTitle: modal.noTitle,
                                    copy: modal.copy
                                });
                                this.display();
                            }
                        };

                        modal.open();
                    });

                return b;
            });

        this.additionalEl = admonitionEl.createDiv("additional");
        await this.buildTypes();

        this.buildAdmonitions(
            this.containerEl.createEl("details", {
                cls: "admonitions-nested-settings",
                attr: {
                    ...(this.plugin.data.open.admonitions ? { open: true } : {})
                }
            })
        );
        this.buildIcons(
            this.containerEl.createEl("details", {
                cls: "admonitions-nested-settings",
                attr: {
                    ...(this.plugin.data.open.icons ? { open: true } : {})
                }
            })
        );
        this.buildOtherSyntaxes(
            this.containerEl.createEl("details", {
                cls: "admonitions-nested-settings",
                attr: {
                    ...(this.plugin.data.open.other ? { open: true } : {})
                }
            })
        );
        this.buildAdvanced(
            this.containerEl.createEl("details", {
                cls: "admonitions-nested-settings",
                attr: {
                    ...(this.plugin.data.open.advanced ? { open: true } : {})
                }
            })
        );

        const div = this.containerEl.createDiv("coffee");
        div.createEl("a", {
            href: "https://www.buymeacoffee.com/valentine195"
        }).createEl("img", {
            attr: {
                src: "https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=valentine195&button_colour=e3e7ef&font_colour=262626&font_family=Inter&outline_colour=262626&coffee_colour=ff0000"
            }
        });
    }

    async buildAdmonitions(containerEl: HTMLDetailsElement) {
        containerEl.empty();
        containerEl.ontoggle = () => {
            this.plugin.data.open.admonitions = containerEl.open;
            this.plugin.saveSettings();
        };
        const summary = containerEl.createEl("summary");
        new Setting(summary).setHeading().setName("Admonitions");
        summary.createDiv("collapser").createDiv("handle");

        new Setting(containerEl)
            .setName("Add Drop Shadow")
            .setDesc("A drop shadow will be added to admonitions.")
            .addToggle((t) => {
                t.setValue(this.plugin.data.dropShadow).onChange(async (v) => {
                    this.plugin.data.dropShadow = v;
                    this.display();
                    await this.plugin.saveSettings();
                });
            });
        new Setting(containerEl)
            .setName(t("Collapsible by Default"))
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: t(
                            "All admonitions will be collapsible by default. Use "
                        )
                    });
                    e.createEl("code", {
                        text: "collapse: none"
                    });
                    e.createSpan({
                        text: t(" to prevent.")
                    });
                })
            )
            .addToggle((t) => {
                t.setValue(this.plugin.data.autoCollapse).onChange(
                    async (v) => {
                        this.plugin.data.autoCollapse = v;
                        this.display();
                        await this.plugin.saveSettings();
                    }
                );
            });

        if (this.plugin.data.autoCollapse) {
            new Setting(containerEl)
                .setName(t("Default Collapse Type"))
                .setDesc(
                    t(
                        "Collapsible admonitions will be either opened or closed."
                    )
                )
                .addDropdown((d) => {
                    d.addOption("open", "open");
                    d.addOption("closed", "closed");
                    d.setValue(this.plugin.data.defaultCollapseType);
                    d.onChange(async (v: "open" | "closed") => {
                        this.plugin.data.defaultCollapseType = v;
                        await this.plugin.saveSettings();
                    });
                });
        }
        new Setting(containerEl)
            .setName(t("Add Copy Button"))
            .setDesc(t("Add a 'copy content' button to admonitions."))
            .addToggle((t) => {
                t.setValue(this.plugin.data.copyButton);
                t.onChange(async (v) => {
                    this.plugin.data.copyButton = v;

                    if (!v) {
                        document
                            .querySelectorAll(".admonition-content-copy")
                            .forEach((el) => {
                                el.detach();
                            });
                    }

                    await this.plugin.saveSettings();
                });
            });
        new Setting(containerEl)
            .setName(t("Parse Titles as Markdown"))
            .setDesc(t("Admonition Titles will be rendered as markdown."))
            .addToggle((t) => {
                t.setValue(this.plugin.data.parseTitles);
                t.onChange(async (v) => {
                    this.plugin.data.parseTitles = v;

                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Set Admonition Colors")
            .setDesc(
                "Disable this setting to turn off admonition coloring by default. Can be overridden in the admonition definition."
            )
            .addToggle((t) =>
                t
                    .setValue(this.plugin.data.injectColor)
                    .setTooltip(
                        `${
                            this.plugin.data.injectColor ? "Disable" : "Enable"
                        } Admonition Color`
                    )
                    .onChange(async (v) => {
                        this.plugin.data.injectColor = v;

                        await this.plugin.saveSettings();

                        await this.buildTypes();
                    })
            );
        new Setting(containerEl)
            .setName("Hide Empty Admonitions")
            .setDesc(
                "Any admonition that does not have content inside it will be hidden."
            )
            .addToggle((t) =>
                t.setValue(this.plugin.data.hideEmpty).onChange(async (v) => {
                    this.plugin.data.hideEmpty = v;

                    await this.plugin.saveSettings();

                    await this.buildTypes();
                })
            );
    }

    buildIcons(containerEl: HTMLDetailsElement) {
        containerEl.empty();
        containerEl.ontoggle = () => {
            this.plugin.data.open.icons = containerEl.open;
            this.plugin.saveSettings();
        };
        const summary = containerEl.createEl("summary");
        new Setting(summary).setHeading().setName("Icon Packs");
        summary.createDiv("collapser").createDiv("handle");

        new Setting(containerEl)
            .setName("Use Font Awesome Icons")
            .setDesc(
                "Font Awesome Free icons will be available in the item picker. Existing Admonitions defined using Font Awesome icons will continue to work."
            )
            .addToggle((t) => {
                t.setValue(this.plugin.data.useFontAwesome).onChange((v) => {
                    this.plugin.data.useFontAwesome = v;
                    this.plugin.iconManager.setIconDefinitions();
                    this.plugin.saveSettings();
                });
            });

        let selected: DownloadableIconPack;
        const possibilities = Object.entries(DownloadableIcons).filter(
            ([icon]) => !this.plugin.data.icons.includes(icon)
        );
        new Setting(containerEl)
            .setName("Load Additional Icons")
            .setDesc(
                "Load an additional icon pack. This requires an internet connection."
            )
            .addDropdown((d) => {
                if (!possibilities.length) {
                    d.setDisabled(true);
                    return;
                }
                for (const [icon, display] of possibilities) {
                    d.addOption(icon, display);
                }
                d.onChange((v: DownloadableIconPack) => (selected = v));
                selected = d.getValue() as DownloadableIconPack;
            })
            .addExtraButton((b) => {
                b.setIcon("plus-with-circle")
                    .setTooltip("Load")
                    .onClick(async () => {
                        if (!selected || !selected.length) return;

                        await this.plugin.iconManager.downloadIcon(selected);
                        this.buildIcons(containerEl);
                    });
                if (!possibilities.length) b.setDisabled(true);
            });

        const iconsEl = containerEl.createDiv("admonitions-nested-settings");
        new Setting(iconsEl);
        for (const icon of this.plugin.data.icons) {
            new Setting(iconsEl)
                .setName(DownloadableIcons[icon])
                .addExtraButton((b) => {
                    b.setIcon("reset")
                        .setTooltip("Redownload")
                        .onClick(async () => {
                            await this.plugin.iconManager.removeIcon(icon);
                            await this.plugin.iconManager.downloadIcon(icon);
                            this.buildIcons(containerEl);
                        });
                })
                .addExtraButton((b) => {
                    b.setIcon("trash").onClick(async () => {
                        if (
                            Object.values(
                                this.plugin.data.userAdmonitions
                            ).find((admonition) => admonition.icon.type == icon)
                        ) {
                            if (
                                !(await confirmWithModal(
                                    this.plugin.app,
                                    "You have Admonitions using icons from this pack. Are you sure you want to remove it?"
                                ))
                            )
                                return;
                        }

                        await this.plugin.iconManager.removeIcon(icon);

                        this.buildIcons(containerEl);
                    });
                });
        }
    }

    buildOtherSyntaxes(containerEl: HTMLDetailsElement) {
        containerEl.empty();
        containerEl.ontoggle = () => {
            this.plugin.data.open.other = containerEl.open;
            this.plugin.saveSettings();
        };
        const summary = containerEl.createEl("summary");
        new Setting(summary).setHeading().setName("Additional Syntaxes");
        summary.createDiv("collapser").createDiv("handle");

        new Setting(containerEl)
            .setName("Allow Microsoft Document Syntax")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: "The plugin will render blockquotes created using the "
                    });
                    e.createEl("a", {
                        href: "https://docs.microsoft.com/en-us/contribute/markdown-reference",
                        text: "Microsoft Document Syntax."
                    });
                })
            )
            .addToggle((t) => {
                t.setValue(this.plugin.data.allowMSSyntax).onChange((v) => {
                    this.plugin.data.allowMSSyntax = v;
                    this.display();
                    this.plugin.saveSettings();
                });
            });
        if (this.plugin.data.allowMSSyntax) {
            new Setting(containerEl)
                .setClass("admonition-setting-warning")
                .setName(
                    "Use Microsoft Document Syntax for Indented Codeblocks"
                )
                .setDesc(
                    createFragment((e) => {
                        e.createSpan({
                            text: "The plugin will render code blocks created by indentation using the "
                        });
                        e.createEl("a", {
                            href: "https://docs.microsoft.com/en-us/contribute/markdown-reference",
                            text: "Microsoft Document Syntax."
                        });
                        e.createEl("br");

                        const strong = e.createSpan(
                            "admonition-setting-warning text-warning"
                        );

                        setIcon(strong.createSpan(), WARNING_ICON_NAME);
                        strong.createSpan({
                            text: "This syntax will not work in Live Preview."
                        });
                    })
                )
                .addToggle((t) => {
                    t.setValue(this.plugin.data.msSyntaxIndented).onChange(
                        (v) => {
                            this.plugin.data.msSyntaxIndented = v;
                            this.plugin.saveSettings();
                        }
                    );
                });
            new Setting(containerEl)
                .setName("Render Microsoft Document Syntax in Live Preview")
                .setDesc(
                    createFragment((e) => {
                        e.createSpan({
                            text: "The plugin will render blockquotes created using the "
                        });
                        e.createEl("a", {
                            href: "https://docs.microsoft.com/en-us/contribute/markdown-reference",
                            text: "Microsoft Document Syntax"
                        });
                        e.createSpan({
                            text: " in live preview mode."
                        });
                    })
                )
                .addToggle((t) => {
                    t.setValue(this.plugin.data.livePreviewMS).onChange((v) => {
                        this.plugin.data.livePreviewMS = v;
                        this.plugin.saveSettings();
                    });
                });
        }
    }
    buildAdvanced(containerEl: HTMLDetailsElement) {
        containerEl.empty();
        containerEl.ontoggle = () => {
            this.plugin.data.open.advanced = containerEl.open;
            this.plugin.saveSettings();
        };
        const summary = containerEl.createEl("summary");
        new Setting(summary).setHeading().setName("Advanced Settings");
        summary.createDiv("collapser").createDiv("handle");

        new Setting(containerEl)
            .setName(t("Markdown Syntax Highlighting"))
            .setDesc(
                t(
                    "Use Obsidian's markdown syntax highlighter in admonition code blocks. This setting is experimental and could cause errors."
                )
            )
            .addToggle((t) => {
                t.setValue(this.plugin.data.syntaxHighlight);
                t.onChange(async (v) => {
                    this.plugin.data.syntaxHighlight = v;
                    if (v) {
                        this.plugin.turnOnSyntaxHighlighting();
                    } else {
                        this.plugin.turnOffSyntaxHighlighting();
                    }
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName(
                createFragment((e) => {
                    const name = e.createSpan("admonition-setting-warning");
                    setIcon(name, WARNING_ICON_NAME);
                    name.createSpan({
                        text: t(" Sync Links to Metadata Cache")
                    });
                })
            )
            .setDesc(
                t(
                    "Try to sync internal links to the metadata cache to display in graph view. This setting could have unintended consequences. Use at your own risk."
                )
            )
            .addToggle((t) => {
                t.setValue(this.plugin.data.syncLinks).onChange(async (v) => {
                    this.plugin.data.syncLinks = v;
                    this.display();
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Generate JS for Publish")
            .setDesc(
                createFragment((f) => {
                    f.createSpan({
                        text: "Generate a javascript file to place in your "
                    });
                    f.createEl("code", { text: "publish.js" });
                    f.createSpan({ text: "file." });
                    f.createEl("br");
                    f.createEl("strong", {
                        text: "Please note that this can only be done on custom domain publish sites."
                    });
                })
            )
            .addButton((b) => {
                b.setButtonText("Generate");
                b.onClick((evt) => {
                    const admonition_icons: {
                        [admonition_type: string]: {
                            icon: string;
                            color: string;
                        };
                    } = {};

                    for (let key in this.plugin.admonitions) {
                        const value = this.plugin.admonitions[key];

                        admonition_icons[key] = {
                            icon: this.plugin.iconManager.getIconNode(
                                value.icon
                            ).outerHTML,
                            color: value.color
                        };
                    }

                    const js = CONTENT.replace(
                        "const ADMONITION_ICON_MAP = {}",
                        "const ADMONITION_ICON_MAP = " +
                            JSON.stringify(admonition_icons)
                    );
                    let csvFile = new Blob([js], {
                        type: "text/javascript"
                    });
                    let downloadLink = document.createElement("a");
                    downloadLink.download = "publish.admonition.js";
                    downloadLink.href = window.URL.createObjectURL(csvFile);
                    downloadLink.style.display = "none";
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                });
            });
    }

    async buildTypes() {
        this.additionalEl.empty();
        for (let a in this.plugin.data.userAdmonitions) {
            const admonition = this.plugin.data.userAdmonitions[a];

            let setting = new Setting(this.additionalEl);

            let admonitionElement = this.plugin.getAdmonitionElement(
                admonition.type,
                admonition.type[0].toUpperCase() +
                    admonition.type.slice(1).toLowerCase(),
                admonition.icon,
                admonition.injectColor ?? this.plugin.data.injectColor
                    ? admonition.color
                    : null
            );
            setting.infoEl.replaceWith(admonitionElement);

            if (!admonition.command) {
                setting.addExtraButton((b) => {
                    b.setIcon(ADD_COMMAND_NAME.toString())
                        .setTooltip(t("Register Commands"))
                        .onClick(async () => {
                            this.plugin.registerCommandsFor(admonition);
                            await this.plugin.saveSettings();
                            this.display();
                        });
                });
            } else {
                setting.addExtraButton((b) => {
                    b.setIcon(REMOVE_COMMAND_NAME.toString())
                        .setTooltip(t("Unregister Commands"))
                        .onClick(async () => {
                            this.plugin.unregisterCommandsFor(admonition);
                            await this.plugin.saveSettings();
                            this.display();
                        });
                });
            }

            setting
                .addExtraButton((b) => {
                    b.setIcon("pencil")
                        .setTooltip(t("Edit"))
                        .onClick(() => {
                            let modal = new SettingsModal(
                                this.plugin,
                                admonition
                            );

                            modal.onClose = async () => {
                                if (modal.saved) {
                                    const hasCommand = admonition.command;
                                    this.plugin.removeAdmonition(admonition);
                                    this.plugin.addAdmonition({
                                        type: modal.type,
                                        color: modal.color,
                                        icon: modal.icon,
                                        command: hasCommand,
                                        title: modal.title,
                                        injectColor: modal.injectColor,
                                        noTitle: modal.noTitle,
                                        copy: modal.copy
                                    });
                                    this.display();
                                }
                            };

                            modal.open();
                        });
                })
                .addExtraButton((b) => {
                    b.setIcon("trash")
                        .setTooltip(t("Delete"))
                        .onClick(() => {
                            this.plugin.removeAdmonition(admonition);
                            this.display();
                        });
                });
        }
    }
}

class SettingsModal extends Modal {
    color: string = "#7d7d7d";
    icon: AdmonitionIconDefinition = {};
    type: string;
    saved: boolean = false;
    error: boolean = false;
    title: string;
    injectColor: boolean = this.plugin.data.injectColor;
    noTitle: boolean = false;
    admonitionPreview: HTMLElement;
    copy: boolean;
    constructor(public plugin: ObsidianAdmonition, admonition?: Admonition) {
        super(plugin.app);
        if (admonition) {
            this.color = admonition.color;
            this.icon = admonition.icon;
            this.type = admonition.type;
            this.title = admonition.title;
            this.injectColor = admonition.injectColor ?? this.injectColor;
            this.noTitle = admonition.noTitle ?? false;
            this.copy = admonition.copy ?? this.plugin.data.copyButton;
        }
    }

    async display() {
        let { contentEl } = this;

        contentEl.empty();

        const settingDiv = contentEl.createDiv();
        const title = this.title ?? this.type ?? "...";

        this.admonitionPreview = this.plugin.getAdmonitionElement(
            this.type,
            title[0].toUpperCase() + title.slice(1).toLowerCase(),
            this.icon,
            this.injectColor ?? this.plugin.data.injectColor ? this.color : null
        );
        this.admonitionPreview.createDiv("admonition-content").createEl("p", {
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla."
        });

        contentEl.appendChild(this.admonitionPreview);
        let typeText: TextComponent;
        const typeSetting = new Setting(settingDiv)
            .setName(t("Admonition Type"))
            .addText((text) => {
                typeText = text;
                typeText.setValue(this.type).onChange((v) => {
                    if (!v.length) {
                        SettingsModal.setValidationError(
                            text,
                            t("Admonition type cannot be empty.")
                        );
                        return;
                    }

                    if (v.includes(" ")) {
                        SettingsModal.setValidationError(
                            text,
                            t("Admonition type cannot include spaces.")
                        );
                        return;
                    }

                    if (!isSelectorValid(v)) {
                        SettingsModal.setValidationError(
                            text,
                            t("Types must be a valid CSS selector.")
                        );
                        return;
                    }

                    SettingsModal.removeValidationError(text);

                    this.type = v;
                    if (!this.title)
                        this.updateTitle(this.admonitionPreview, this.type);
                });
            });
        typeSetting.controlEl.addClass("admonition-type-setting");

        typeSetting.descEl.createSpan({
            text: "This is used to create the admonition (e.g.,  "
        });
        typeSetting.descEl.createEl("code", {
            text: "note"
        });
        typeSetting.descEl.createSpan({
            text: " or "
        });
        typeSetting.descEl.createEl("code", {
            text: "abstract"
        });
        typeSetting.descEl.createSpan({
            text: ")"
        });

        new Setting(settingDiv)
            .setName(t("Admonition Title"))
            .setDesc(
                t("This will be the default title for this admonition type.")
            )
            .addText((text) => {
                text.setValue(this.title).onChange((v) => {
                    if (!v.length) {
                        this.title = null;
                        this.updateTitle(this.admonitionPreview, this.type);
                        return;
                    }

                    this.title = v;
                    this.updateTitle(this.admonitionPreview, this.title);
                });
            });
        new Setting(settingDiv)
            .setName(t("No Admonition Title by Default"))
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: t("The admonition will have no title unless ")
                    });
                    e.createEl("code", { text: "title" });
                    e.createSpan({ text: t(" is explicitly provided.") });
                })
            )
            .addToggle((t) => {
                t.setValue(this.noTitle).onChange((v) => (this.noTitle = v));
            });
        new Setting(settingDiv)
            .setName(t("Show Copy Button"))
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: t(
                            "A copy button will be added to the admonition."
                        )
                    });
                })
            )
            .addToggle((t) => {
                t.setValue(this.copy).onChange((v) => (this.copy = v));
            });

        const input = createEl("input", {
            attr: {
                type: "file",
                name: "image",
                accept: "image/*"
            }
        });
        let iconText: TextComponent;
        new Setting(settingDiv)
            .setName(t("Admonition Icon"))
            .setDesc("Icon to display next to the title.")
            .addText((text) => {
                iconText = text;
                if (this.icon.type !== "image") text.setValue(this.icon.name);

                const validate = async () => {
                    const v = text.inputEl.value;
                    let ic = this.plugin.iconManager.getIconType(v);
                    if (!ic) {
                        SettingsModal.setValidationError(
                            text,
                            t("Invalid icon name.")
                        );
                        return;
                    }

                    if (v.length == 0) {
                        SettingsModal.setValidationError(
                            text,
                            t("Icon cannot be empty.")
                        );
                        return;
                    }

                    SettingsModal.removeValidationError(text);

                    this.icon = modal.icon ?? {
                        name: v as AdmonitionIconName,
                        type: ic as AdmonitionIconType
                    };

                    let iconEl = this.admonitionPreview.querySelector(
                        ".admonition-title-icon"
                    );

                    iconEl.innerHTML = this.plugin.iconManager.getIconNode(
                        this.icon
                    ).outerHTML;
                };

                const modal = new IconSuggestionModal(this.plugin, text);

                modal.onClose = validate;

                text.inputEl.onblur = validate;
            })
            .addButton((b) => {
                b.setButtonText(t("Upload Image")).setIcon("image-file");
                b.buttonEl.addClass("admonition-file-upload");
                b.buttonEl.appendChild(input);
                b.onClick(() => input.click());
            });

        /** Image Uploader */
        input.onchange = async () => {
            const { files } = input;

            if (!files.length) return;

            const image = files[0];
            const reader = new FileReader();
            reader.onloadend = (evt) => {
                var image = new Image();
                image.onload = () => {
                    try {
                        // Resize the image
                        const canvas = document.createElement("canvas"),
                            max_size = 24;
                        let width = image.width,
                            height = image.height;
                        if (width > height) {
                            if (width > max_size) {
                                height *= max_size / width;
                                width = max_size;
                            }
                        } else {
                            if (height > max_size) {
                                width *= max_size / height;
                                height = max_size;
                            }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        canvas
                            .getContext("2d")
                            .drawImage(image, 0, 0, width, height);

                        this.icon = {
                            name: canvas.toDataURL("image/png"),
                            type: "image"
                        };
                        this.display();
                    } catch (e) {
                        new Notice("There was an error parsing the image.");
                    }
                };
                image.src = evt.target.result.toString();
            };
            reader.readAsDataURL(image);

            input.value = null;
        };

        const color = settingDiv.createDiv("admonition-color-settings");
        this.createColor(color);

        let footerEl = contentEl.createDiv();
        let footerButtons = new Setting(footerEl);
        footerButtons.addButton((b) => {
            b.setTooltip(t("Save"))
                .setIcon("checkmark")
                .onClick(async () => {
                    let error = false;
                    if (!typeText.inputEl.value.length) {
                        SettingsModal.setValidationError(
                            typeText,
                            t("Admonition type cannot be empty.")
                        );
                        error = true;
                    }

                    if (typeText.inputEl.value.includes(" ")) {
                        SettingsModal.setValidationError(
                            typeText,
                            t("Admonition type cannot include spaces.")
                        );
                        error = true;
                    }

                    if (!isSelectorValid(typeText.inputEl.value)) {
                        SettingsModal.setValidationError(
                            typeText,
                            t("Types must be a valid CSS selector.")
                        );
                        error = true;
                    }

                    if (
                        !this.plugin.iconManager.getIconType(
                            iconText.inputEl.value
                        ) &&
                        this.icon.type !== "image"
                    ) {
                        SettingsModal.setValidationError(
                            iconText,
                            t("Invalid icon name.")
                        );
                        error = true;
                    }

                    if (!this.icon.name.length) {
                        SettingsModal.setValidationError(
                            iconText,
                            t("Icon cannot be empty.")
                        );
                        error = true;
                    }

                    if (error) {
                        new Notice("Fix errors before saving.");
                        return;
                    }
                    this.saved = true;
                    this.close();
                });
            return b;
        });
        footerButtons.addExtraButton((b) => {
            b.setIcon("cross")
                .setTooltip("Cancel")
                .onClick(() => {
                    this.saved = false;
                    this.close();
                });
            return b;
        });
    }
    createColor(el: HTMLDivElement) {
        el.empty();
        const desc = this.injectColor
            ? "Set the admonition color. Disable to set manually using CSS."
            : "Admonition color is disabled and must be manually set using CSS.";
        new Setting(el)
            .setName(t("Color"))
            .setDesc(desc)
            .addText((t) => {
                t.inputEl.setAttribute("type", "color");

                if (!this.injectColor) {
                    t.inputEl.setAttribute("disabled", "true");
                }

                t.setValue(rgbToHex(this.color)).onChange((v) => {
                    let color = hexToRgb(v);
                    if (!color) return;
                    this.color = `${color.r}, ${color.g}, ${color.b}`;
                    this.admonitionPreview.setAttribute(
                        "style",
                        `--admonition-color: ${this.color};`
                    );
                });
            })
            .addToggle((t) =>
                t
                    .setValue(this.injectColor)
                    .setTooltip(
                        `${
                            this.injectColor ? "Disable" : "Enable"
                        } Admonition Color`
                    )
                    .onChange((v) => {
                        this.injectColor = v;

                        if (!v) {
                            this.admonitionPreview.removeAttribute("style");
                        } else {
                            this.admonitionPreview.setAttribute(
                                "style",
                                `--admonition-color: ${this.color};`
                            );
                        }

                        this.createColor(el);
                    })
            );
    }
    updateTitle(admonitionPreview: HTMLElement, title: string) {
        let titleSpan = admonitionPreview.querySelector(
            ".admonition-title-content"
        );
        let iconEl = admonitionPreview.querySelector(".admonition-title-icon");
        titleSpan.textContent =
            title[0].toUpperCase() + title.slice(1).toLowerCase();
        titleSpan.prepend(iconEl);
    }
    onOpen() {
        this.display();
    }

    static setValidationError(textInput: TextComponent, message?: string) {
        textInput.inputEl.addClass("is-invalid");
        if (message) {
            textInput.inputEl.parentElement.addClasses([
                "has-invalid-message",
                "unset-align-items"
            ]);
            textInput.inputEl.parentElement.parentElement.addClass(
                ".unset-align-items"
            );
            let mDiv = textInput.inputEl.parentElement.querySelector(
                ".invalid-feedback"
            ) as HTMLDivElement;

            if (!mDiv) {
                mDiv = createDiv({ cls: "invalid-feedback" });
            }
            mDiv.innerText = message;
            mDiv.insertAfter(textInput.inputEl);
        }
    }
    static removeValidationError(textInput: TextComponent) {
        textInput.inputEl.removeClass("is-invalid");
        textInput.inputEl.parentElement.removeClasses([
            "has-invalid-message",
            "unset-align-items"
        ]);
        textInput.inputEl.parentElement.parentElement.removeClass(
            ".unset-align-items"
        );

        if (
            textInput.inputEl.parentElement.querySelector(".invalid-feedback")
        ) {
            textInput.inputEl.parentElement.removeChild(
                textInput.inputEl.parentElement.querySelector(
                    ".invalid-feedback"
                )
            );
        }
    }
}

function hexToRgb(hex: string) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
          }
        : null;
}
function componentToHex(c: number) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(rgb: string) {
    let result = /^(\d+),\s?(\d+),\s?(\d+)/i.exec(rgb);
    if (!result || !result.length) {
        return "";
    }
    return `#${componentToHex(Number(result[1]))}${componentToHex(
        Number(result[2])
    )}${componentToHex(Number(result[3]))}`;
}
