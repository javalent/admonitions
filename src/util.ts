import {
	findIconDefinition,
	icon,
	IconName,
} from "@fortawesome/fontawesome-svg-core";
import { MarkdownRenderer } from "obsidian";

export function getAdmonitionElement(
	type: string,
	title: string,
	iconName: string,
	color: string,
	collapse?: string
): HTMLElement {
	let admonition,
		titleEl,
		attrs: { style: string; open?: string } = {
			style: `--admonition-color: ${color};`,
		};
	if (collapse) {
		if (collapse === "open") {
			attrs.open = "open";
		}
		admonition = createEl("details", {
			cls: `admonition admonition-${type}`,
			attr: attrs,
		});
		titleEl = admonition.createEl("summary", {
			cls: `admonition-title ${!title.trim().length ? "no-title" : ""}`,
		});
	} else {
		admonition = createDiv({
			cls: `admonition admonition-${type}`,
			attr: attrs,
		});
		titleEl = admonition.createDiv({
			cls: `admonition-title ${!title.trim().length ? "no-title" : ""}`,
		});
	}

	let titleContentEl = createDiv("title-content");
	MarkdownRenderer.renderMarkdown(title, titleContentEl, "", null);

	const iconEl = createDiv("admonition-title-icon");
	if (iconName) {
		iconEl.appendChild(
			icon(
				findIconDefinition({
					iconName: iconName as IconName,
					prefix: "fas",
				})
			).node[0]
		);
	}
	titleContentEl.children[0].addClass("admonition-title-content");
	titleContentEl.children[0].prepend(iconEl);
	titleEl.appendChild(titleContentEl.children[0]);

	if (collapse) {
		titleEl.createDiv("collapser").createDiv("handle");
	}
	return admonition;
}
