import {
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    TFile
} from "obsidian";
import { Admonition } from "src/@types";
import ObsidianAdmonition from "src/main";

export default class AdmonitionSuggest extends EditorSuggest<string> {
    constructor(public plugin: ObsidianAdmonition) {
        super(plugin.app);
    }
    getSuggestions(ctx: EditorSuggestContext) {
        return Object.keys(this.plugin.admonitions).filter((p) =>
            p.toLowerCase().contains(ctx.query.toLowerCase())
        );
    }
    renderSuggestion(text: string, el: HTMLElement) {
        el.createSpan({ text });
    }
    selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
        if (!this.context) return;

        const line = this.context.editor
            .getLine(this.context.end.line)
            .slice(this.context.end.ch);
        if (!/\]/.test(line)) value = `${value}]`;

        console.log(value, this.context.start, this.context.end);

        this.context.editor.replaceRange(
            value,
            this.context.start,
            this.context.end
        );

        this.context.editor.setCursor(
            this.context.start.line,
            this.context.start.ch + value.length
        );

        this.close();
    }
    onTrigger(
        cursor: EditorPosition,
        editor: Editor,
        file: TFile
    ): EditorSuggestTriggerInfo {
        const line = editor.getLine(cursor.line);
        if (/> \[!\w+\]/.test(line.slice(0, cursor.ch))) return;
        if (/> \[!\w*/.test(line)) {
            const match = line.match(/> \[!(\w*)\]?/);
            if (!match) return null;
            const [_, query] = match;
            const index = match.index + match.length + query.length;
            if (query) {
                const matchData = {
                    end: cursor,
                    start: {
                        ch: index,
                        line: cursor.line
                    },
                    query
                };
                return matchData;
            }
        }
        return null;
    }
}
