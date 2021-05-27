import { MarkdownPostProcessorContext, Plugin_2 } from "obsidian";

export interface Admonition {
    type: string;
    icon: string;
    color: string;
    command: boolean;
}

export interface INestedAdmonition {
    type: string;
    start: number;
    end: number;
    src: string;
}

export interface ISettingsData {
    userAdmonitions: {
        [admonitionType: string]: Admonition;
    };
    syntaxHighlight: boolean;
    copyButton: boolean;
    autoCollapse: boolean;
    defaultCollapseType: string;
    syncLinks: boolean;
    version: string;
}
export declare class ObsidianAdmonitionPlugin extends Plugin_2 {
    removeAdmonition: (admonition: Admonition) => Promise<void>;
    admonitions: { [admonitionType: string]: Admonition };
    /*     userAdmonitions: { [admonitionType: string]: Admonition };
    syntaxHighlight: boolean; */
    data: ISettingsData;
    turnOnSyntaxHighlighting: (types?: string[]) => void;
    turnOffSyntaxHighlighting: (types?: string[]) => void;
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
    unregisterCommandsFor(admonition: Admonition): void;
    registerCommandsFor(admonition: Admonition): void;
}
