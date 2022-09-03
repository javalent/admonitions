import { IconName } from "@fortawesome/fontawesome-svg-core";
import { DownloadableIconPack } from "src/icons/manager";
import { ObsidianIconNames } from "src/icons/obsidian";

export interface Admonition {
    type: string;
    title?: string;
    icon: AdmonitionIconDefinition;
    color: string;
    command: boolean;
    injectColor?: boolean;
    noTitle: boolean;
    copy?: boolean;
}

export interface NestedAdmonition {
    type: string;
    start: number;
    end: number;
    src: string;
}

export interface AdmonitionSettings {
    userAdmonitions: Record<string, Admonition>;
    syntaxHighlight: boolean;
    copyButton: boolean;
    autoCollapse: boolean;
    defaultCollapseType: "open" | "closed";
    version: string;
    injectColor: boolean;
    parseTitles: boolean;
    dropShadow: boolean;
    hideEmpty: boolean;
    icons: Array<DownloadableIconPack>;
    useFontAwesome: boolean;
    rpgDownloadedOnce: boolean;
    open: {
        admonitions: boolean;
        icons: boolean;
        other: boolean;
        advanced: boolean;
    };
    msDocConverted: boolean;
    useSnippet: boolean;
    snippetPath: string;
}

export type AdmonitionIconDefinition = {
    type?: IconType;
    name?: IconName | ObsidianIconNames | string;
};

export type IconType =
    | "font-awesome"
    | "obsidian"
    | "image"
    | DownloadableIconPack;

export type AdmonitionIconName = AdmonitionIconDefinition["name"];
export type AdmonitionIconType = AdmonitionIconDefinition["type"];