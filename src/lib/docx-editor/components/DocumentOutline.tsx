import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { HeadingInfo } from '../utils/headingCollector';
import { MaterialSymbol } from './ui/Icons';

/** @deprecated Use HeadingInfo from utils/headingCollector instead */
export type OutlineHeading = HeadingInfo;

interface DocumentOutlineProps {
  headings: HeadingInfo[];
  onHeadingClick: (pmPos: number) => void;
  onClose: () => void;
  topOffset?: number;
}

interface OutlineNode {
  heading: HeadingInfo;
  level: number;
  children: OutlineNode[];
  isExpanded: boolean;
  isHidden: boolean;
}

/**
 * Build a tree structure from flat heading list.
 * Uses lastHeadingAtLevel to track the most recent heading at each level,
 * correctly handling level jumps (e.g., H1 -> H3 -> H2 stays nested under H1).
 */
function buildHeadingTree(headings: HeadingInfo[]): OutlineNode[] {
  const root: OutlineNode[] = [];
  // lastHeadingAtLevel[l] = most recent OutlineNode with level l (1-indexed)
  const lastHeadingAtLevel: (OutlineNode | undefined)[] = [];

  for (const heading of headings) {
    const level = heading.level;
    const node: OutlineNode = {
      heading,
      level,
      children: [],
      isExpanded: true,
      isHidden: false,
    };

    // Ensure the array is large enough
    if (lastHeadingAtLevel.length < level + 1) {
      lastHeadingAtLevel.length = level + 1;
    }

    // Parent is the most recent heading at level-1
    const parent = level > 1 ? lastHeadingAtLevel[level - 1] : undefined;

    if (!parent) {
      // Top-level heading
      root.push(node);
    } else {
      // Nested under parent
      parent.children.push(node);
    }

    // Record this node as the last heading at this level
    lastHeadingAtLevel[level] = node;
  }

  return root;
}

export const DocumentOutline: React.FC<DocumentOutlineProps> = ({
  headings,
  onHeadingClick,
  onClose,
  topOffset = 0,
}) => {
  const [open, setOpen] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]));

  useEffect(() => {
    // Trigger slide-in on next frame
    requestAnimationFrame(() => setOpen(true));
  }, []);

  // Build tree structure from headings
  const tree = useMemo(() => buildHeadingTree(headings), [headings]);

  // Toggle expand/collapse for a level
  const toggleLevel = useCallback((level: number) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }, []);

  // Check if a node's ancestors are all expanded
  const isNodeVisible = useCallback(
    (node: OutlineNode, expandedLevels: Set<number>): boolean => {
      const level = node.level;
      // A node is visible if its level is expanded or any of its ancestors' levels are expanded
      if (level <= 1) return true;

      // Find if any ancestor level is collapsed
      for (let l = level - 1; l >= 1; l--) {
        if (!expandedLevels.has(l)) return false;
      }
      return true;
    },
    []
  );

  // Flatten tree for rendering, respecting expand/collapse state
  const flattenedNodes = useMemo(() => {
    const result: { node: OutlineNode; visible: boolean }[] = [];

    function flatten(nodes: OutlineNode[]) {
      for (const node of nodes) {
        const visible = isNodeVisible(node, expandedLevels);
        result.push({ node, visible });

        if (node.children.length > 0 && expandedLevels.has(node.level)) {
          flatten(node.children);
        }
      }
    }

    flatten(tree);
    return result;
  }, [tree, expandedLevels, isNodeVisible]);

  return (
    <nav
      className="docx-outline-nav"
      role="navigation"
      aria-label="Document outline"
      style={{
        position: 'absolute',
        top: topOffset,
        left: 30,
        bottom: 0,
        width: 240,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
        zIndex: 40,
        // Slide-in animation
        transform: open ? 'translateX(0)' : 'translateX(-270px)',
        transition: 'transform 0.15s ease-out',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header — back arrow + title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '16px 16px 12px',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close outline"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            color: '#444746',
          }}
          title="Close outline"
        >
          <MaterialSymbol name="arrow_back" size={20} />
        </button>
        <span style={{ fontWeight: 400, fontSize: 14, color: '#1f1f1f', letterSpacing: '0.01em' }}>
          Outline
        </span>
        {/* Expand/Collapse all button */}
        <button
          onClick={() => {
            if (expandedLevels.size === 0) {
              setExpandedLevels(new Set([1]));
            } else {
              setExpandedLevels(new Set());
            }
          }}
          aria-label="Expand all"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            color: '#444746',
            marginLeft: 'auto',
          }}
          title={expandedLevels.size === 0 ? 'Expand all' : 'Collapse all'}
        >
          <MaterialSymbol
            name={expandedLevels.size === 0 ? 'unfold_more' : 'unfold_less'}
            size={18}
          />
        </button>
      </div>

      {/* Heading list */}
      <div style={{ overflowY: 'auto', flex: 1, paddingLeft: 8 }}>
        {headings.length === 0 ? (
          <div style={{ padding: '8px 16px', color: '#80868b', fontSize: 13, lineHeight: '20px' }}>
            No headings found. Add headings to your document to see them here.
          </div>
        ) : (
          flattenedNodes.map(({ node, visible }, index) => {
            const hasChildren = node.children.length > 0;
            const isExpanded = expandedLevels.has(node.level);
            const marginLeft = Math.max(0, (node.level - 1) * 12);

            return (
              <div
                key={`${node.heading.pmPos}-${index}`}
                style={{
                  marginLeft,
                  display: visible ? 'block' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* Expand/collapse toggle for headings with children */}
                  {hasChildren ? (
                    <button
                      onClick={() => toggleLevel(node.level)}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                        color: '#80868b',
                        flexShrink: 0,
                      }}
                    >
                      <MaterialSymbol
                        name={isExpanded ? 'expand_more' : 'chevron_right'}
                        size={16}
                      />
                    </button>
                  ) : (
                    <span style={{ width: 20, flexShrink: 0 }} />
                  )}
                  <button
                    className="docx-outline-heading-btn"
                    onClick={() => onHeadingClick(node.heading.pmPos)}
                    style={{
                      display: 'block',
                      flex: 1,
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px 4px',
                      fontSize: node.level === 1 ? 13 : 12,
                      fontWeight: node.level === 1 ? 500 : 400,
                      color: node.level === 1 ? '#1f1f1f' : '#3c4043',
                      lineHeight: '18px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      borderRadius: 0,
                      letterSpacing: '0.01em',
                    }}
                    title={node.heading.text}
                  >
                    {node.heading.text}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </nav>
  );
};
