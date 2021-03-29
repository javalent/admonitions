import {
    MarkdownPostProcessorContext,
    MarkdownRenderChild,
    MarkdownRenderer,
    Notice,
    Plugin
} from "obsidian";

import fromEntries from "object.fromentries";
if (!Object.fromEntries) {
    //incorrect @types definition
    //I tested that this correctly shims without error
    //@ts-expect-error
    fromEntries.shim();
}

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

export default class ObsidianAdmonition extends Plugin {
    async onload(): Promise<void> {
        console.log("Obsidian Admonition loaded");

        Object.keys(ADMONITION_MAP).forEach((type) =>
            this.registerMarkdownCodeBlockProcessor(
                type,
                this.postprocessor.bind(this, type)
            )
        );
    }
    postprocessor(
        type: string,
        src: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ) {
        try {
            /**
             * Find title and collapse parameters.
             */
            let matchedParameters =
                src.match(/^\b(title|collapse)\b:([\s\S]*?)$/gm) || [];

            let params = Object.fromEntries(
                matchedParameters.map((p) =>
                    p.split(/:\s?/).map((s) => s.trim())
                )
            );

            let {
                title = type[0].toUpperCase() + type.slice(1).toLowerCase(),
                collapse
            } = params;

            /**
             * Get the content. Content should be everything that is not the title or collapse parameters.
             * Remove any "content: " fields (legacy from < v0.2.0)
             */
            let content = src.replace(
                /^\b(title|collapse)\b:([\s\S]*?)$/gm,
                ""
            );
            content = content.replace(/^\bcontent\b:\s?/gm, "");

            /**
             * If the admonition should collapse, but something other than open or closed was provided, set to closed.
             */
            if (
                Object.prototype.hasOwnProperty.call(params, "collapse") &&
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
                (params.title === undefined || params.title.length === 0) &&
                collapse
            ) {
                title = type[0].toUpperCase() + type.slice(1).toLowerCase();
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
                ctx.sourcePath,
                markdownRenderChild
            );

            /**
             * Replace the <pre> tag with the new admonition.
             */
            el.replaceWith(admonitionElement);
        } catch (e) {
            console.error(e);
            const pre = createEl("pre");
            const textError = getComputedStyle(document.body).getPropertyValue(
                "--text-error"
            )
                ? getComputedStyle(document.body).getPropertyValue(
                      "--text-error"
                  )
                : "#ff3333";

            pre.createEl("code", {
                attr: {
                    style: `color: ${textError.trim()} !important`
                }
            }).createSpan({
                text:
                    "There was an error rendering the admonition:" +
                    "\n\n" +
                    src
            });

            el.replaceWith(pre);
        }
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
            if (collapse === "open") {
                attrs = { open: "open" };
            } else {
                attrs = {};
            }
            /* attrs = {
                [collapse]: true
            }; */
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
