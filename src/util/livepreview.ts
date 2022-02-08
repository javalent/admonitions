import type { SelectionRange, EditorState } from "@codemirror/state";
import {
    apiVersion,
    editorLivePreviewField,
    editorViewField,
    requireApiVersion
} from "obsidian";

export const rangesInclude = (
    ranges: readonly SelectionRange[],
    from: number,
    to: number
) => {
    for (const range of ranges) {
        const { from: rFrom, to: rTo } = range;
        if (rFrom >= from && rFrom <= to) return true;
        if (rTo >= from && rTo <= to) return true;
        if (rFrom < from && rTo > to) return true;
    }
    return false;
};

export const isLivePreview = (state: EditorState) => {
    const md = state.field(editorViewField);
    const { state: viewState } = md.leaf.getViewState() ?? {};

    if (requireApiVersion && requireApiVersion("0.13.23")) {
        return state.field(editorLivePreviewField);
    } else {
        const md = state.field(editorViewField);
        const { state: viewState } = md.leaf.getViewState() ?? {};

        return (
            viewState && viewState.mode == "source" && viewState.source == false
        );
    }
};
