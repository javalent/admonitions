import {
    findIconDefinition,
    icon,
    IconName
} from "@fortawesome/fontawesome-svg-core";
import { MarkdownRenderer } from "obsidian";

export async function getAdmonitionElement(
    type: string,
    title: string,
    iconName: string,
    color: string,
    collapse?: string
): Promise<HTMLElement> {
    return new Promise(async (resolve) => {
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
                cls: `admonition admonition-${type}`,
                attr: attrs
            });
            titleEl = admonition.createEl("summary", {
                cls: `admonition-title ${
                    !title.trim().length ? "no-title" : ""
                }`
            });
        } else {
            admonition = createDiv({
                cls: `admonition admonition-${type}`,
                attr: attrs
            });
            titleEl = admonition.createDiv({
                cls: `admonition-title ${
                    !title.trim().length ? "no-title" : ""
                }`
            });
        }

        if (title && title.length) {
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
            await MarkdownRenderer.renderMarkdown(
                title,
                markdownHolder,
                "",
                null
            );

            //admonition-title-content is first child of rendered markdown
            const admonitionTitleContent = markdownHolder.children[0];

            //get children of markdown element, then remove them
            const markdownElements = Array.from(
                admonitionTitleContent?.childNodes || []
            );
            admonitionTitleContent.innerHTML = "";
            admonitionTitleContent.addClass("admonition-title-content");

            //build icon element
            const iconEl = admonitionTitleContent.createDiv(
                "admonition-title-icon"
            );
            if (iconName) {
                iconEl.appendChild(
                    icon(
                        findIconDefinition({
                            iconName: iconName as IconName,
                            prefix: "fas"
                        })
                    ).node[0]
                );
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
        resolve(admonition);
    });
}
