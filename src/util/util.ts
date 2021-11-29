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
        admonition.title ?? type[0].toUpperCase() + type.slice(1).toLowerCase();
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
            .slice(keywordTokens[keywordIndex].length)
            .trim();
        ++skipLines;
    }

    let { title, collapse, icon, color } = params;

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

    if (!("title" in params)) {
        if (!admonition.noTitle) {
            title = admonitionTitle;
        }
    }
    /**
     * If the admonition should collapse, but title was blanked, set the default title.
     */
    if (
        title &&
        title.trim() === "" &&
        collapse !== undefined &&
        collapse !== "none"
    ) {
        title = admonitionTitle;
        new Notice("An admonition must have a title if it is collapsible.");
    }

    return { title, collapse, content, icon, color };
}
