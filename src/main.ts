import { MarkdownPostProcessorContext, Notice, Plugin } from "obsidian";

import "./main.css";

const ADMONITION_MAP: {
    [admonitionType: string]: string;
} = {
    note: "note",
    seealso: "note",
    abstract: "abstract",
    summary: "abstract",
    info: "info",
    todo: "todo",
    tip: "tip",
    hint: "tip",
    important: "tip",
    success: "success",
    check: "check",
    done: "done",
    question: "question",
    help: "question",
    faq: "question",
    warning: "warning",
    caution: "warning",
    attention: "warning",
    failure: "failure",
    fail: "failure",
    missing: "failure",
    danger: "danger",
    error: "danger",
    bug: "bug",
    example: "example",
    quote: "quote",
    cite: "quote"
};
const classMap = Object.keys(ADMONITION_MAP).map((k) => `language-${k}`);

/** Fast Intersection taken from
 * https://codeburst.io/optimizing-array-analytics-in-javascript-part-two-search-intersection-and-cross-products-79b4a6d68da0
 */
const fastIntersection = (...arrays: any[]) => {
    // if we process the arrays from shortest to longest
    // then we will identify failure points faster, i.e. when
    // one item is not in all arrays
    const ordered =
            arrays.length === 1
                ? arrays
                : arrays.sort((a1, a2) => a1.length - a2.length),
        shortest = ordered[0],
        set = new Set(), // used for bookeeping, Sets are faster
        result = []; // the intersection, conversion from Set is slow
    // for each item in the shortest array
    for (let i = 0; i < shortest.length; i++) {
        const item = shortest[i];
        // see if item is in every subsequent array
        let every = true; // don't use ordered.every ... it is slow
        for (let j = 1; j < ordered.length; j++) {
            if (ordered[j].includes(item)) continue;
            every = false;
            break;
        }
        // ignore if not in every other array, or if already captured
        if (!every || set.has(item)) continue;
        // otherwise, add to bookeeping set and the result
        set.add(item);
        result[result.length] = item;
    }
    return result;
};
export default class ObsidianAdmonition extends Plugin {
    async onload(): Promise<void> {
        console.log("Obsidian Admonition loaded");

        this.registerMarkdownPostProcessor(this.postprocessor.bind(this));
    }
    postprocessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        //don't process if no code elements in element;
        let codeBlocks = el.querySelectorAll("code");
        if (!codeBlocks.length) return;

        //don't process if the code block is not an admonition type
        codeBlocks = Array.prototype.filter.call(
            codeBlocks,
            (element: HTMLElement) =>
                element &&
                fastIntersection(
                    Array.prototype.slice.call(element.classList),
                    classMap
                ).length > 0
        );
        if (!codeBlocks.length) return;

        //render admonition element
        codeBlocks.forEach((block) => {
            if (block) {
                let type =
                    ADMONITION_MAP[
                        Array.prototype.find
                            .call(block.classList, (cls: string) =>
                                classMap.includes(cls)
                            )
                            .split("language-")
                            .pop()
                            .trim()
                    ];
                if (!type) {
                    new Notice("There was an error rendering the admonition.");
                    return;
                }
                let params = Object.fromEntries(
                    block.innerText
                        .split("\n")
                        .map((l) => l.split(":").map((s) => s.trim()))
                );
                let {
                    title = type[0].toUpperCase() + type.slice(1).toLowerCase(),
                    content = block.innerText,
                    collapse
                } = params;

                if (
                    Object.prototype.hasOwnProperty.call(params, "title") &&
                    params.title === undefined &&
                    params.collapse
                ) {
                    title = "";
                }
                if (
                    Object.prototype.hasOwnProperty.call(params, "collapse") &&
                    (params.collapse.length == 0 ||
                        params.collapse === undefined ||
                        collapse !== "open")
                ) {
                    collapse = "closed";
                }

                this.buildAdmonition(
                    block.parentElement,
                    type,
                    title,
                    content,
                    collapse
                );
            }
        });
    }
    buildAdmonition(
        el: HTMLElement,
        type: string,
        title: string,
        content: string,
        collapse?: string
    ) {
        let attrs,
            els: Array<keyof HTMLElementTagNameMap> = ["div", "div"];
        if (collapse) {
            els = ["details", "summary"];
            attrs = {
                [collapse]: true
            };
        }

        let admonition = createEl(els[0], {
            cls: `admonition admonition-${type}`,
            attr: attrs
        });
        admonition.createEl(els[1], {
            cls: `admonition-title ${!title.trim().length ? "no-title" : ""}`,
            text: title
        });
        admonition.createEl("p", {
            cls: "admonition-content",
            text: content
        });

        el.parentElement.replaceChild(admonition, el);
    }
    onunload() {
        console.log("Obsidian Admonition unloaded");
    }
}
