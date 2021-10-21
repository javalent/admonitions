import { MarkdownRenderer, Notice } from "obsidian";

/* import { nanoid } from "nanoid"; */

import { getIconNode } from "./icons";
import {
    Admonition,
    AdmonitionIconDefinition,
    INestedAdmonition
} from "../@types";

export function getID() {
    return "ID_xyxyxyxyxyxy".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function getMatches(
    src: string,
    from: number,
    toMatch: string
): INestedAdmonition {
    const split = src.split("\n").slice(from);
    const first = split.indexOf(split.find((l) => l == toMatch));

    let next = first + 1;
    for (; next < split.length; next++) {
        if (!/^(?: {2,4}|\t)+[\s\S]*?/.test(split[next])) break;
    }

    let innerSrc = split.slice(first + 1, next).join("\n");

    const toRemove = innerSrc.split("\n")[0].match(/^(\s+)/);
    innerSrc = innerSrc.replace(new RegExp(`^${toRemove[0] || ""}`, "gm"), "");

    return {
        start: first + from,
        end: next + from - 1,
        src: innerSrc,
        type: toMatch.split("-").pop()
    };
}

function startsWithAny(str: string, needles: string[]) {
    for (let i = 0; i < needles.length; i++) {
        if (str.startsWith(needles[i])) {
            return i;
        }
    }

    return false;
}

export function getParametersFromSource(
    type: string,
    src: string,
    admonition: Admonition
) {
    const admonitionTitle =
        admonition.title ??
        type[0].toUpperCase() + type.slice(1).toLowerCase();
    const keywordTokens = ["title:", "collapse:", "icon:", "color:"];

    const keywords = ["title", "collapse", "icon", "color"];

    let lines = src.split("\n");

    let skipLines = 0;

    let params: { [k: string]: string } = {};

    for (let i = 0; i < lines.length; i++) {
        let keywordIndex = startsWithAny(lines[i], keywordTokens);

        if (keywordIndex === false) {
            break;
        }

        let foundKeyword = keywords[keywordIndex];

        if (params[foundKeyword] !== undefined) {
            break;
        }

        params[foundKeyword] = lines[i]
            .substr(keywordTokens[keywordIndex].length)
            .trim();
        ++skipLines;
    }

    let { title = admonitionTitle, collapse, icon, color } = params;

    let content = lines.slice(skipLines).join("\n");

    /**
     * If the admonition should collapse, but something other than open or closed was provided, set to closed.
     */
    if (
        collapse !== undefined &&
        collapse !== "none" &&
        collapse !== "open" &&
        collapse !== "closed"
    ) {
        collapse = "closed";
    }

    /**
     * If the admonition should collapse, but title was blanked, set the default title.
     */
    if (title.trim() === "" && collapse !== undefined && collapse !== "none") {
        title = admonitionTitle;
        new Notice("An admonition must have a title if it is collapsible.");
    }

    return { title, collapse, content, icon, color };
}

export /* async */ function getAdmonitionElement(
    type: string,
    title: string,
    icon: AdmonitionIconDefinition,
    color: string,
    collapse?: string,
    id?: string
): HTMLElement {
    let admonition,
        titleEl,
        attrs: { style: string; open?: string } = {
            style: `--admonition-color: ${color};`
        };
    if (collapse && collapse != "none") {
        if (collapse === "open") {
            attrs.open = "open";
        }
        admonition = createEl("details", {
            cls: `admonition admonition-${type} admonition-plugin`,
            attr: attrs
        });
        titleEl = admonition.createEl("summary", {
            cls: `admonition-title ${!title?.trim().length ? "no-title" : ""}`
        });
    } else {
        admonition = createDiv({
            cls: `admonition admonition-${type} admonition-plugin`,
            attr: attrs
        });
        titleEl = admonition.createDiv({
            cls: `admonition-title ${!title?.trim().length ? "no-title" : ""}`
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
export async function getAdmonitionElementAsync(
    type: string,
    title: string,
    icon: AdmonitionIconDefinition,
    color: string,
    collapse?: string,
    id?: string
): Promise<HTMLElement> {
    let admonition,
        titleEl,
        attrs: { style: string; open?: string } = {
            style: `--admonition-color: ${color};`
        };
    if (collapse) {
        if (collapse === "open") {
            attrs.open = "open";
        }
        admonition = createEl("details", {
            cls: `admonition admonition-${type} admonition-plugin admonition-plugin-async`,
            attr: attrs
        });
        titleEl = admonition.createEl("summary", {
            cls: `admonition-title ${!title.trim().length ? "no-title" : ""}`
        });
    } else {
        admonition = createDiv({
            cls: `admonition admonition-${type} admonition-plugin`,
            attr: attrs
        });
        titleEl = admonition.createDiv({
            cls: `admonition-title ${!title.trim().length ? "no-title" : ""}`
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
        const markdownHolder = createDiv();
        await MarkdownRenderer.renderMarkdown(title, markdownHolder, "", null);

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
