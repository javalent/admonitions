import { MarkdownPostProcessorContext, Plugin } from "obsidian";

import "./main.css";
import ADMONITION_MAP from "./admonitions";

export default class Admonition extends Plugin {
    async onload(): Promise<void> {
        console.log("Obsidian Admonition loaded");

        this.registerMarkdownPostProcessor(this.postprocessor.bind(this));
    }
    postprocessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        /*  */
        let codeBlocks = el.querySelectorAll("code");
        if (!codeBlocks.length) return;
        const classMap = Object.keys(ADMONITION_MAP).map(
            (k) => `language-${k}`
        );

        codeBlocks = Array.prototype.map
            .call(
                codeBlocks,
                (element: HTMLElement): HTMLElement => {
                    if (element) {
                        const classList = Array.prototype.filter.call(
                            element.classList,
                            (cls: string) => classMap.includes(cls)
                        );
                        if (classList.length) return element;
                    }
                }
            )
            .filter((b: HTMLElement) => b);
        if (!codeBlocks.length) return;

        codeBlocks.forEach((block) => {
            if (block) {
                let classType = Array.prototype.find.call(
                    block.classList,
                    (cls: string) => classMap.includes(cls)
                );
                if (!classType) return;
                let type =
                    ADMONITION_MAP[classType.split("language-").pop().trim()];
                if (!type) return;
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
                console.log(
                    "🚀 ~ file: main.ts ~ line 56 ~ Admonition ~ codeBlocks.forEach ~ params",
                    params,
                    block.innerText
                        .split("\n")
                        .map((l) => l.split(":").map((s) => s.trim()))
                );

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
                        params.collapse === undefined)
                ) {
                    collapse = "closed";
                }
                console.log(
                    "🚀 ~ file: main.ts ~ line 69 ~ Admonition ~ codeBlocks.forEach ~ params.collapse",
                    collapse
                );
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
            els = [
                "div" as keyof HTMLElementTagNameMap,
                "div" as keyof HTMLElementTagNameMap
            ];
        if (collapse && ["open", "closed"].includes(collapse)) {
            els = [
                "details" as keyof HTMLElementTagNameMap,
                "summary" as keyof HTMLElementTagNameMap
            ];
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
