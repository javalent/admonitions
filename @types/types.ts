import { MarkdownPostProcessorContext, Plugin_2 } from "obsidian";

export interface Admonition {
    type: string;
    icon: string;
    color: string;
}

export declare class ObsidianAdmonitionPlugin extends Plugin_2 {
    removeAdmonition: (admonition: Admonition) => Promise<void>;
    admonitions: { [admonitionType: string]: Admonition };
    userAdmonitions: { [admonitionType: string]: Admonition };
    saveSettings: () => Promise<void>;
    loadSettings: () => Promise<void>;
    addAdmonition: (admonition: Admonition) => Promise<void>;
    onload: () => Promise<void>;
    onunload: () => Promise<void>;
    postprocessor: (
        type: string,
        src: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ) => void;
    getAdmonitionElement: (
        type: string,
        title: string,
        collapse?: string
    ) => HTMLElement;
}
