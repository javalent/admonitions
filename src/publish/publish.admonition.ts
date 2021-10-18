
import "../assets/main.css";

interface DomElementInfo {
    /**
     * The class to be assigned. Can be a space-separated string or an array of strings.
     */
    cls?: string | string[];
    /**
     * The textContent to be assigned.
     */
    text?: string;
    /**
     * HTML attributes to be added.
     */
    attr?: {
        [key: string]: string | number | boolean | null;
    };
    /**
     * HTML title (for hover tooltip).
     */
    title?: string;
    /**
     * The parent element to be assigned to.
     */
    parent?: Node;
    value?: string;
    type?: string;
    prepend?: boolean;
    href?: string;
}

function createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    t?: string | DomElementInfo,
    e?: HTMLElement
): HTMLElementTagNameMap[K] {
    const i = document.createElement(tag);
    "string" == typeof t &&
        (t = {
            cls: t
        });
    const r = t || {},
        o = r.cls,
        s = r.text,
        a = r.attr,
        l = r.title,
        c = r.value,
        u = r.type,
        h = e ? e : r.parent,
        p = r.prepend,
        d = r.href;
    return (
        o &&
            (Array.isArray(o)
                ? (i.className = o.join(" "))
                : (i.className = o)),
        s && (i.textContent = s),
        a &&
            Object.keys(a).forEach((t) => {
                const n = a[t];
                null !== n && i.setAttribute(t, String(n));
            }),
        l && (i.title = l),
        c &&
            (i instanceof HTMLInputElement ||
                i instanceof HTMLSelectElement ||
                i instanceof HTMLOptionElement) &&
            (i.value = c),
        /* u && i instanceof HTMLInputElement && (i.type = u), */
        u && i instanceof HTMLStyleElement && i.setAttribute("type", u),
        d &&
            (i instanceof HTMLAnchorElement || i instanceof HTMLLinkElement) &&
            (i.href = d),
        h && (p ? h.insertBefore(i, h.firstChild) : h.appendChild(i)),
        i
    );
}
//@ts-ignore-line
const createDiv = function (
    o?: string | DomElementInfo,
    e?: HTMLElement
): HTMLDivElement {
    return createEl("div", o, e);
};

Node.prototype.createDiv = function (
    o?: string | DomElementInfo,
    cb?: (el: HTMLDivElement) => void
): HTMLDivElement {
    return createDiv(o, this);
};
Node.prototype.createEl = function <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    o?: string | DomElementInfo,
    cb?: (el: HTMLElementTagNameMap[K]) => void
): HTMLElementTagNameMap[K] {
    return createEl(tag, o, this);
};

Element.prototype.addClass = function (...args) {
    const e = [];
    for (let t = 0; t < args.length; t++) e[t] = args[t];
    this.addClasses(e);
};

Element.prototype.addClasses = function (e) {
    for (let t = 0; t < e.length; t++) this.classList.add(e[t]);
};

function getAdmonitionElement(
    type: string,
    title: string,
    icon: string,
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
        //MarkdownRenderer.renderMarkdown(title, markdownHolder, "", null);

        //admonition-title-content is first child of rendered markdown

        const admonitionTitleContent =
            /* markdownHolder?.children[0]?.tagName === "P"
        ? createDiv()
        : markdownHolder.children[0] ??  */ createDiv();


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
        if (icon) {
            iconEl.innerHTML = icon;
        }

        //add markdown children back
        const admonitionTitleMarkdown = admonitionTitleContent.createDiv(
            "admonition-title-markdown"
        );
        admonitionTitleMarkdown.innerText = title;
        /* for (let i = 0; i < markdownElements.length; i++) {
            admonitionTitleMarkdown.appendChild(markdownElements[i]);
        } */
        titleEl.appendChild(admonitionTitleContent || createDiv());
    }

    //add them to title element

    if (collapse) {
        titleEl.createDiv("collapser").createDiv("handle");
    }
    return admonition;
}
function startsWithAny(str: string, needles: string[]) {
    for (let i = 0; i < needles.length; i++) {
        if (str.startsWith(needles[i])) {
            return i;
        }
    }

    return false;
}

function getParametersFromSource(type: string, src: string) {
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

    let {
        title = type[0].toUpperCase() + type.slice(1).toLowerCase(),
        collapse,
        icon,
        color
    } = params;

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
        title = type[0].toUpperCase() + type.slice(1).toLowerCase();
        return;
    }

    return { title, collapse, content, icon, color };
}

interface AdmonitionPublishDefinition {
    icon: string;
    color: string;
}

const ADMONITION_ICON_MAP: { [admonitionType: string]: AdmonitionPublishDefinition } = {};

document.addEventListener("DOMContentLoaded", function (event) {
    //do work

    const admonitions = document.querySelectorAll(
        "pre[class*='language-ad']"
    ) as NodeListOf<HTMLPreElement>;

    if (!admonitions.length) return;

    for (let admonitionBlock of Array.from(admonitions)) {

        const [, type] = admonitionBlock.classList.toString().match(/language-ad-(\w+)/);
        if (!type) continue;
        if (!(type in ADMONITION_ICON_MAP)) continue;

        let {
            title = type[0].toUpperCase() + type.slice(1).toLowerCase(),
            collapse,
            content,
            icon = ADMONITION_ICON_MAP[type].icon,
            color = ADMONITION_ICON_MAP[type].color,
        } = getParametersFromSource(type, admonitionBlock.innerText);

        let admonition = getAdmonitionElement(
            type,
            title,
            icon,
            color,
            collapse
        );

        const contentHolder = admonition.createDiv("admonition-content-holder");

        const admonitionContent = contentHolder.createDiv("admonition-content");

        admonitionContent.innerText = content;

        admonitionBlock.replaceWith(admonition);
    }
});
