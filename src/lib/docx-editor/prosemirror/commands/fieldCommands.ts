/**
 * Field Commands — insert PAGE, NUMPAGES, and other inline fields
 */

import type { Command } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';

/**
 * Insert a PAGE field (page number) at the current cursor position.
 * Creates a field node that renders as the current page number.
 */
export const insertPageNumber: Command = (state, dispatch) => {
  const { schema } = state;
  const fieldType = schema.nodes.field;
  if (!fieldType) return false;

  if (dispatch) {
    const { $from } = state.selection;

    const fieldNode = fieldType.create({
      fieldType: 'PAGE',
      instruction: 'PAGE \\* MERGEFORMAT',
      displayText: `{page}`,
      fieldKind: 'simple',
      fldLock: false,
      dirty: false,
    });

    const tr = state.tr;
    tr.insert($from.pos, fieldNode);
    // Place cursor after the field
    tr.setSelection(TextSelection.create(tr.doc, $from.pos + fieldNode.nodeSize));
    dispatch(tr.scrollIntoView());
  }

  return true;
};

/**
 * Insert a NUMPAGES field (total page count) at the current cursor position.
 */
export const insertTotalPages: Command = (state, dispatch) => {
  const { schema } = state;
  const fieldType = schema.nodes.field;
  if (!fieldType) return false;

  if (dispatch) {
    const { $from } = state.selection;

    const fieldNode = fieldType.create({
      fieldType: 'NUMPAGES',
      instruction: 'NUMPAGES \\* MERGEFORMAT',
      displayText: `{pages}`,
      fieldKind: 'simple',
      fldLock: false,
      dirty: false,
    });

    const tr = state.tr;
    tr.insert($from.pos, fieldNode);
    tr.setSelection(TextSelection.create(tr.doc, $from.pos + fieldNode.nodeSize));
    dispatch(tr.scrollIntoView());
  }

  return true;
};