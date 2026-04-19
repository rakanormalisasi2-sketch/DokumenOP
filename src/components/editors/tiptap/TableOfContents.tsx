
import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';

interface ToCItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    editor: Editor | null;
    onClose: () => void;
}

export function TableOfContents({ editor, onClose }: TableOfContentsProps) {
    const [items, setItems] = useState<ToCItem[]>([]);

    useEffect(() => {
        if (!editor) return;

        const updateToC = () => {
            const newItems: ToCItem[] = [];
            const doc = editor.state.doc;

            doc.descendants((node, pos) => {
                if (node.type.name === 'heading') {
                    const id = `heading-${pos}`;
                    // Temporarily adding ID if not exists (in a real extension we'd use node attributes)
                    newItems.push({
                        id, // We'll just use pos for navigation
                        text: node.textContent,
                        level: node.attrs.level,
                    });
                }
            });
            setItems(newItems);
        };

        updateToC();
        editor.on('update', updateToC);

        return () => {
            editor.off('update', updateToC);
        };
    }, [editor]);

    const jumpTo = (pos: number) => {
        if (!editor) return;

        // Parse pos from ID (simple hack for now)
        // In a real app, uses node IDs
        editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
    };

    return (
        <div className="w-64 border-l bg-muted/10 p-4 h-full overflow-y-auto hidden lg:block animate-in slide-in-from-right-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Daftar Isi</h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">×</button>
            </div>

            {items.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Tidak ada heading.</p>
            ) : (
                <ul className="space-y-1">
                    {items.map((item, index) => {
                        // Extract pos from id for the hack
                        const pos = parseInt(item.id.split('-')[1]);

                        return (
                            <li
                                key={index}
                                style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                            >
                                <button
                                    onClick={() => jumpTo(pos)}
                                    className="text-xs hover:underline text-left w-full truncate py-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {item.text}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
