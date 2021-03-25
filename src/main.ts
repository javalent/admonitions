import {
    MarkdownPostProcessorContext,
    MarkdownRenderChild,
    MarkdownRenderer,
    Notice,
    Plugin
} from "obsidian";

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
            try {
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
                        new Notice(
                            "There was an error rendering the admonition."
                        );
                        return;
                    }

                    /**
                     * Find title and collapse parameters.
                     */
                    let innerText = block.innerText;
                    let matchedParameters =
                        innerText.match(
                            /^\b(title|collapse)\b:([\s\S]*?)$/gm
                        ) || [];

                    let params = Object.fromEntries(
                        matchedParameters.map((p) =>
                            p.split(/:\s?/).map((s) => s.trim())
                        )
                    );

                    let {
                        title = type[0].toUpperCase() +
                            type.slice(1).toLowerCase(),
                        collapse
                    } = params;

                    /**
                     * Get the content. Content should be everything that is not the title or collapse parameters.
                     * Remove any "content: " fields (legacy from < v0.2.0)
                     */
                    let content = innerText.replace(
                        /^\b(title|collapse)\b:([\s\S]*?)$/gm,
                        ""
                    );
                    content = content.replace(/^\bcontent\b:\s?/gm, "");

                    /**
                     * If the admonition should collapse, but something other than open or closed was provided, set to closed.
                     */
                    if (
                        Object.prototype.hasOwnProperty.call(
                            params,
                            "collapse"
                        ) &&
                        (params.collapse.length == 0 ||
                            params.collapse === undefined ||
                            collapse !== "open")
                    ) {
                        collapse = "closed";
                    }
                    /**
                     * If the admonition should collapse, but title was blanked, set the default title.
                     */
                    if (
                        Object.prototype.hasOwnProperty.call(params, "title") &&
                        (params.title === undefined ||
                            params.title.length === 0) &&
                        collapse
                    ) {
                        title =
                            type[0].toUpperCase() + type.slice(1).toLowerCase();
                        new Notice(
                            "An admonition must have a title if it is collapsible."
                        );
                    }

                    /**
                     * Build the correct admonition element.
                     * Collapsible -> <details> <summary> Title </summary> <div> Content </div> </details>
                     * Regular -> <div> <div> Title </div> <div> Content </div> </div>
                     */
                    let admonitionElement = this.getAdmonitionElement(
                        type,
                        title,
                        collapse
                    );

                    /**
                     * Create a unloadable component.
                     */
                    let admonitionContent = admonitionElement.createDiv({
                        cls: "admonition-content"
                    });
                    let markdownRenderChild = new MarkdownRenderChild();
                    markdownRenderChild.containerEl = admonitionElement;

                    /**
                     * Render the content as markdown and append it to the admonition.
                     */
                    MarkdownRenderer.renderMarkdown(
                        content,
                        admonitionContent,
                        this.app.workspace.getActiveFile()?.path,
                        markdownRenderChild
                    );

                    /**
                     * Replace the <pre> tag with the new admonition.
                     */
                    block.parentElement.parentElement.replaceChild(
                        admonitionElement,
                        block.parentElement
                    );
                }
            } catch (e) {
                new Notice(
                    "There was an error rendering the admonition element."
                );
            }
        });
    }
    getAdmonitionElement(
        type: string,
        title: string,
        collapse?: string
    ): HTMLElement {
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

        return admonition;
    }
    onunload() {
        console.log("Obsidian Admonition unloaded");
    }
}
