
import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Search, Replace, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface FindReplaceProps {
    editor: Editor | null;
    onClose: () => void;
}

export function FindReplace({ editor, onClose }: FindReplaceProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [replaceTerm, setReplaceTerm] = useState('');
    const [results, setResults] = useState<{ from: number; to: number }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    const find = useCallback(() => {
        if (!editor || !searchTerm) {
            setResults([]);
            setCurrentIndex(-1);
            return;
        }

        const matches: { from: number; to: number }[] = [];
        const doc = editor.state.doc;

        doc.descendants((node, pos) => {
            if (node.isText) {
                const text = node.text!;
                const regex = new RegExp(searchTerm, 'gi');
                let match;
                while ((match = regex.exec(text)) !== null) {
                    matches.push({
                        from: pos + match.index,
                        to: pos + match.index + match[0].length,
                    });
                }
            }
        });

        setResults(matches);
        if (matches.length > 0) {
            setCurrentIndex(0);
            highlight(matches[0]);
        } else {
            setCurrentIndex(-1);
        }
    }, [editor, searchTerm]);

    const highlight = (range: { from: number; to: number }) => {
        if (!editor) return;
        editor.commands.setTextSelection(range);
        editor.commands.scrollIntoView();
    };

    const next = () => {
        if (results.length === 0) return;
        const nextIndex = (currentIndex + 1) % results.length;
        setCurrentIndex(nextIndex);
        highlight(results[nextIndex]);
    };

    const prev = () => {
        if (results.length === 0) return;
        const prevIndex = (currentIndex - 1 + results.length) % results.length;
        setCurrentIndex(prevIndex);
        highlight(results[prevIndex]);
    };

    const replace = () => {
        if (!editor || currentIndex === -1 || !results[currentIndex]) return;

        const { from, to } = results[currentIndex];
        editor.chain().focus().setTextSelection({ from, to }).insertContent(replaceTerm).run();

        // Re-run find to update positions
        setTimeout(find, 50);
    };

    const replaceAll = () => {
        if (!editor || !searchTerm) return;

        // Iterate backwards to avoid index shifting issues
        const doc = editor.state.doc;
        const matches: { from: number; to: number }[] = [];
        doc.descendants((node, pos) => {
            if (node.isText) {
                const text = node.text!;
                const regex = new RegExp(searchTerm, 'gi');
                let match;
                while ((match = regex.exec(text)) !== null) {
                    matches.push({
                        from: pos + match.index,
                        to: pos + match.index + match[0].length,
                    });
                }
            }
        });

        if (matches.length === 0) return;

        editor.chain().focus();
        // Replace from end to start
        for (let i = matches.length - 1; i >= 0; i--) {
            const { from, to } = matches[i];
            editor.chain().setTextSelection({ from, to }).insertContent(replaceTerm);
        }
        editor.chain().run();

        setTimeout(find, 50);
    };

    return (
        <div className="absolute top-14 right-4 z-50 bg-background border rounded-lg shadow-lg p-3 w-80 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Cari..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && find()}
                    className="h-8 text-xs"
                    autoFocus
                />
                <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap min-w-[3rem] justify-center">
                    {results.length > 0 ? `${currentIndex + 1}/${results.length}` : '0/0'}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="w-3 h-3" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Replace className="w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Ganti dengan..."
                    value={replaceTerm}
                    onChange={(e) => setReplaceTerm(e.target.value)}
                    className="h-8 text-xs"
                />
            </div>

            <div className="flex items-center justify-between mt-1">
                <div className="flex gap-1">
                    <Button variant="secondary" size="sm" className="h-7 px-2" onClick={prev} disabled={results.length === 0}>
                        <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button variant="secondary" size="sm" className="h-7 px-2" onClick={next} disabled={results.length === 0}>
                        <ChevronDown className="w-3 h-3" />
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button onClick={replace} disabled={results.length === 0} size="sm" variant="outline" className="h-7 text-xs">Ganti</Button>
                    <Button onClick={replaceAll} disabled={results.length === 0} size="sm" className="h-7 text-xs">Semua</Button>
                </div>
            </div>
        </div>
    );
}
