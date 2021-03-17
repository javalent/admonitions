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

        codeBlocks = Array.prototype.map.call(
            codeBlocks,
            (element: HTMLElement): HTMLElement => {
                const classList = Array.prototype.filter.call(
                    element.classList,
                    (cls: string) => classMap.includes(cls)
                );
                if (classList.length) return element;
            }
        );
        if (!codeBlocks.length) return;

        codeBlocks.forEach((block) => {
            let classType = Array.prototype.find.call(
                block.classList,
                (cls: string) => classMap.includes(cls)
            );
            if (!classType) return;
            let type =
                ADMONITION_MAP[classType.split("language-").pop().trim()];
            if (!type) return;
            const {
                title = type[0].toUpperCase() + type.slice(1).toLowerCase(),
                content = block.innerText
            } = Object.fromEntries(
                block.innerText.split("\n").map((l) => l.split(": "))
            );
            this.buildAdmonition(block.parentElement, type, title, content);
        });
    }
    buildAdmonition(
        el: HTMLElement,
        type: string,
        title: string,
        content: string
    ) {
        let admonition = createDiv({
            cls: `admonition admonition-${type}`
        });
        admonition.createDiv({
            cls: "admonition-title",
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
