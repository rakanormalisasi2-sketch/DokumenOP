import { Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import { createExtension } from '../create';
import { Priority } from '../types';
import type { ExtensionRuntime, ExtensionContext } from '../types';
import { findWordBoundaries } from '../../../utils/textSelection';

export const extendSelectionPluginKey = new PluginKey('extendSelection');

export enum ExtendLevel {
    None = 0,
    Word = 1,
    Sentence = 2,
    Paragraph = 3,
    Document = 4,
}

export interface ExtendSelectionState {
    active: boolean;
    level: ExtendLevel;
    anchor: number | null;
}

const SENTENCE_END_REGEX = /[.!?]+(\s+|$)/;

export const ExtendSelectionExtension = createExtension({
    name: 'extendSelection',
    priority: Priority.High,
    onSchemaReady(_ctx: ExtensionContext): ExtensionRuntime {
        return {
            plugins: [
                new Plugin<ExtendSelectionState>({
                    key: extendSelectionPluginKey,
                    state: {
                        init() {
                            return { active: false, level: ExtendLevel.None, anchor: null };
                        },
                        apply(tr, value, oldState, newState) {
                            const meta = tr.getMeta(extendSelectionPluginKey);
                            if (meta) {
                                return { ...value, ...meta };
                            }

                            // If the user clicked or typed (but not a navigation related to F8), we should probably reset.
                            // For simplicity, if selection changes and it's not our F8 command doing it,
                            // we check if it's a mouse click or typing.
                            if (tr.selectionSet && !tr.getMeta('extendSelectionCommand')) {
                                if (tr.isGeneric || tr.steps.length > 0) {
                                    return { active: false, level: ExtendLevel.None, anchor: null };
                                }
                            }

                            if (tr.steps.length > 0 && value.active) {
                                return { active: false, level: ExtendLevel.None, anchor: null };
                            }

                            return value;
                        },
                    },
                }),
            ],
            keyboardShortcuts: {
                F8: (state, dispatch) => {
                    const pluginState = extendSelectionPluginKey.getState(state);
                    if (!pluginState) return false;

                    let newLevel = pluginState.level;
                    let anchor = pluginState.anchor;

                    if (!pluginState.active) {
                        newLevel = ExtendLevel.Word; // First press often selects word in word processor if nothing is selected
                        anchor = state.selection.anchor;
                    } else {
                        newLevel = pluginState.level + 1;
                        if (newLevel > ExtendLevel.Document) {
                            newLevel = ExtendLevel.None; // Cycle back or stop? Actually, Escape cancels it. But let's cycle to document.
                            return true; // Already at document
                        }
                    }

                    if (dispatch) {
                        let tr = state.tr;
                        let from = state.selection.from;
                        let to = state.selection.to;
                        const doc = state.doc;

                        if (newLevel === ExtendLevel.Word) {
                            const $pos = state.doc.resolve(state.selection.head);
                            if ($pos.parent.isTextblock) {
                                const text = $pos.parent.textContent;
                                const offset = $pos.parentOffset;
                                const [wStart, wEnd] = findWordBoundaries(text, offset, false);
                                const startPos = $pos.start() + wStart;
                                const endPos = $pos.start() + wEnd;
                                tr = tr.setSelection(TextSelection.create(doc, startPos, endPos));
                            }
                        } else if (newLevel === ExtendLevel.Sentence) {
                            const $pos = state.doc.resolve(state.selection.head);
                            if ($pos.parent.isTextblock) {
                                const text = $pos.parent.textContent;
                                const offset = $pos.parentOffset;
                                // Extremely basic sentence detection
                                let sStart = 0;
                                let sEnd = text.length;

                                // find previous sentence end
                                let leftText = text.slice(0, offset);
                                let match;
                                let lastIndex = -1;
                                const r = /[.!?]+(\s+)/g;
                                while ((match = r.exec(leftText)) !== null) {
                                    lastIndex = match.index + match[0].length;
                                }
                                if (lastIndex !== -1) sStart = lastIndex;

                                // find next sentence end
                                let rightText = text.slice(offset);
                                const rightMatch = /[.!?]+(\s+|$)/.exec(rightText);
                                if (rightMatch) {
                                    sEnd = offset + rightMatch.index + rightMatch[0].length;
                                }

                                tr = tr.setSelection(TextSelection.create(doc, $pos.start() + sStart, $pos.start() + sEnd));
                            }
                        } else if (newLevel === ExtendLevel.Paragraph) {
                            const $pos = state.doc.resolve(state.selection.head);
                            tr = tr.setSelection(TextSelection.create(doc, $pos.start(), $pos.end()));
                        } else if (newLevel === ExtendLevel.Document) {
                            tr = tr.setSelection(TextSelection.create(doc, 0, doc.content.size));
                        }

                        tr.setMeta(extendSelectionPluginKey, { active: true, level: newLevel, anchor: anchor ?? state.selection.anchor });
                        tr.setMeta('extendSelectionCommand', true);
                        dispatch(tr);
                    }
                    return true;
                },
                Escape: (state, dispatch) => {
                    const pluginState = extendSelectionPluginKey.getState(state);
                    if (pluginState?.active) {
                        if (dispatch) {
                            const tr = state.tr;
                            tr.setMeta(extendSelectionPluginKey, { active: false, level: ExtendLevel.None, anchor: null });
                            // Collapse to anchor
                            tr.setSelection(TextSelection.create(state.doc, pluginState.anchor ?? state.selection.anchor));
                            tr.setMeta('extendSelectionCommand', true);
                            dispatch(tr);
                        }
                        return true;
                    }
                    return false; // let baseKeymap handle Escape
                }
            },
        };
    },
});
