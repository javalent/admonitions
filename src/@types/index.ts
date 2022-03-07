import { IconName } from "@fortawesome/fontawesome-svg-core";
import { DownloadableIconPack } from "src/icons/manager";

export interface Admonition {
    type: string;
    title?: string;
    icon: AdmonitionIconDefinition;
    color: string;
    command: boolean;
    injectColor: boolean;
    noTitle: boolean;
    copy: boolean;
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
    allowMSSyntax: boolean;
    msSyntaxIndented: boolean;
    livePreviewMS: boolean;
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
}

export type AdmonitionIconDefinition = {
    type?: "font-awesome" | "image" | DownloadableIconPack;
    name?: IconName | string;
};

export type AdmonitionIconName = AdmonitionIconDefinition["name"];
export type AdmonitionIconType = AdmonitionIconDefinition["type"];