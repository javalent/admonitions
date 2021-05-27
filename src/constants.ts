import { Admonition } from "../@types/types";

export const ADD_ADMONITION_COMMAND_ICON = `<svg viewBox="0 0 100 100" class="add-admonition-command"><path fill="currentColor" stroke="currentColor" d="M37,16c-4.4,0-8.3,3.3-9.2,7.6l-11.6,52c-0.5,2.2,0,4.3,1.2,5.9c1.2,1.6,3.2,2.6,5.4,2.6H79c4.4,0,8.3-3.3,9.2-7.6 l11.6-52c0.5-2.2,0-4.3-1.2-5.9C97.4,17,95.4,16,93.2,16L37,16z M37,20h56.2c1.1,0,1.8,0.4,2.2,1c0.5,0.6,0.7,1.4,0.4,2.6l-1,4.4 H30.8l0.8-3.6C32.1,22.2,34.8,20,37,20z M29.9,32H94l-9.6,43.6C83.9,77.8,81.2,80,79,80H22.8c-1.1,0-1.8-0.4-2.2-1 c-0.5-0.6-0.7-1.4-0.4-2.6L29.9,32z M0,36v4h19.6l0.9-4L0,36z M36.7,38c-0.8,0.1-1.4,0.7-1.6,1.5l-3.5,14c-0.2,0.6,0,1.2,0.4,1.7 c0.4,0.5,1,0.8,1.6,0.8H81c0.9,0,1.7-0.6,1.9-1.5l3.5-14c0.2-0.6,0-1.3-0.4-1.8c-0.4-0.5-1-0.8-1.6-0.8H37.1c-0.1,0-0.1,0-0.2,0 C36.9,38,36.8,38,36.7,38L36.7,38z M38.7,42h43.2l-2.4,10H36.2L38.7,42z M0,52v4h16l0.9-4H0z M0,68v4h12.4l0.9-4H0z"></path><circle fill="white" transform="translate(50 50) scale(3 3)" cx="8" cy="8" r="8"/><path fill="green" transform="translate(50 50) scale(3 3)" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z"/></svg>`;
export const ADD_COMMAND_NAME = "add-admonition-command-icon";

export const REMOVE_ADMONITION_COMMAND_ICON = `<svg viewBox="0 0 100 100" class="remove-admonition-command"><path fill="currentColor" stroke="currentColor" d="M37,16c-4.4,0-8.3,3.3-9.2,7.6l-11.6,52c-0.5,2.2,0,4.3,1.2,5.9c1.2,1.6,3.2,2.6,5.4,2.6H79c4.4,0,8.3-3.3,9.2-7.6 l11.6-52c0.5-2.2,0-4.3-1.2-5.9C97.4,17,95.4,16,93.2,16L37,16z M37,20h56.2c1.1,0,1.8,0.4,2.2,1c0.5,0.6,0.7,1.4,0.4,2.6l-1,4.4 H30.8l0.8-3.6C32.1,22.2,34.8,20,37,20z M29.9,32H94l-9.6,43.6C83.9,77.8,81.2,80,79,80H22.8c-1.1,0-1.8-0.4-2.2-1 c-0.5-0.6-0.7-1.4-0.4-2.6L29.9,32z M0,36v4h19.6l0.9-4L0,36z M36.7,38c-0.8,0.1-1.4,0.7-1.6,1.5l-3.5,14c-0.2,0.6,0,1.2,0.4,1.7 c0.4,0.5,1,0.8,1.6,0.8H81c0.9,0,1.7-0.6,1.9-1.5l3.5-14c0.2-0.6,0-1.3-0.4-1.8c-0.4-0.5-1-0.8-1.6-0.8H37.1c-0.1,0-0.1,0-0.2,0 C36.9,38,36.8,38,36.7,38L36.7,38z M38.7,42h43.2l-2.4,10H36.2L38.7,42z M0,52v4h16l0.9-4H0z M0,68v4h12.4l0.9-4H0z"></path><circle fill="white" transform="translate(50 50) scale(3 3)" cx="8" cy="8" r="8"/><path fill="#dc3545" transform="translate(50 50) scale(3 3)" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7z"/></svg>`;
export const REMOVE_COMMAND_NAME = "remove-admonition-command-icon";


export const ADMONITION_MAP: Record<string, Admonition> = {
    note: {
        type: "note",
        color: "68, 138, 255",
        icon: "pencil-alt",
        command: false
    },
    seealso: {
        type: "note",
        color: "68, 138, 255",
        icon: "pencil-alt",
        command: false
    },
    abstract: {
        type: "abstract",
        color: "0, 176, 255",
        icon: "book",
        command: false
    },
    summary: {
        type: "abstract",
        color: "0, 176, 255",
        icon: "book",
        command: false
    },
    info: {
        type: "info",
        color: "0, 184, 212",
        icon: "info-circle",
        command: false
    },
    todo: {
        type: "info",
        color: "0, 184, 212",
        icon: "info-circle",
        command: false
    },
    tip: { type: "tip", color: "0, 191, 165", icon: "fire", command: false },
    hint: { type: "tip", color: "0, 191, 165", icon: "fire", command: false },
    important: {
        type: "tip",
        color: "0, 191, 165",
        icon: "fire",
        command: false
    },
    success: {
        type: "success",
        color: "0, 200, 83",
        icon: "check-circle",
        command: false
    },
    check: {
        type: "success",
        color: "0, 200, 83",
        icon: "check-circle",
        command: false
    },
    done: {
        type: "success",
        color: "0, 200, 83",
        icon: "check-circle",
        command: false
    },
    question: {
        type: "question",
        color: "100, 221, 23",
        icon: "question-circle",
        command: false
    },
    help: {
        type: "question",
        color: "100, 221, 23",
        icon: "question-circle",
        command: false
    },
    faq: {
        type: "question",
        color: "100, 221, 23",
        icon: "question-circle",
        command: false
    },
    warning: {
        type: "warning",
        color: "255, 145, 0",
        icon: "exclamation-triangle",
        command: false
    },
    caution: {
        type: "warning",
        color: "255, 145, 0",
        icon: "exclamation-triangle",
        command: false
    },
    attention: {
        type: "warning",
        color: "255, 145, 0",
        icon: "exclamation-triangle",
        command: false
    },
    failure: {
        type: "failure",
        color: "255, 82, 82",
        icon: "times-circle",
        command: false
    },
    fail: {
        type: "failure",
        color: "255, 82, 82",
        icon: "times-circle",
        command: false
    },
    missing: {
        type: "failure",
        color: "255, 82, 82",
        icon: "times-circle",
        command: false
    },
    danger: {
        type: "danger",
        color: "255, 23, 68",
        icon: "bolt",
        command: false
    },
    error: {
        type: "danger",
        color: "255, 23, 68",
        icon: "bolt",
        command: false
    },
    bug: { type: "bug", color: "245, 0, 87", icon: "bug", command: false },
    example: {
        type: "example",
        color: "124, 77, 255",
        icon: "list-ol",
        command: false
    },
    quote: {
        type: "quote",
        color: "158, 158, 158",
        icon: "quote-right",
        command: false
    },
    cite: {
        type: "quote",
        color: "158, 158, 158",
        icon: "quote-right",
        command: false
    }
};
