import { Notice } from "obsidian";
import { Admonition } from "../@types";

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
    const keywordTokens = ["title:", "collapse:", "icon:", "color:", "metadata:"];

    const keywords = ["title", "collapse", "icon", "color", "metadata"];

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

    let { title, collapse, icon, color, metadata } = params;

    // If color is in RGB format
    if (color && color.startsWith('rgb')) {
        color = color.slice(4, -1);
    }

    // If color is in Hex format, convert it to RGB
    if (color && color.startsWith('#')) {
        const hex = color.slice(1);
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        color = `${r}, ${g}, ${b}`;
    }

    // If color is in HSL format, convert it to RGB
    if (color && color.startsWith('hsl')) {
        const [h, s, l] = color.slice(4, -1).split(',').map(str => Number(str.replace('%', '').trim()));
        const [r, g, b] = hslToRgb(h, s, l);
        color = `${r}, ${g}, ${b}`;
    }

    // If color is in HSB format, convert it to RGB
    if (color && (color.startsWith('hsb') || color.startsWith('hsv'))) {
        const [h, s, v] = color.slice(4, -1).split(',').map(str => Number(str.replace('%', '').trim()));
        const [r, g, b] = hsbToRgb(h, s, v);
        color = `${r}, ${g}, ${b}`;
    }
    
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

    return { title, collapse, content, icon, color, metadata };
}

function hslToRgb(h: number, s: number, l: number) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hsbToRgb(h: number, s: number, b: number) {
    h /= 360;
    s /= 100;
    b /= 100;
    let r, g, bb;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = b * (1 - s);
    let q = b * (1 - f * s);
    let t = b * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = b, g = t, bb = p; break;
        case 1: r = q, g = b, bb = p; break;
        case 2: r = p, g = b, bb = t; break;
        case 3: r = p, g = q, bb = b; break;
        case 4: r = t, g = p, bb = b; break;
        case 5: r = b, g = p, bb = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(bb * 255)];
}