import React from 'react';
import { NativeDocxEditor } from '@/components/editors/NativeDocxEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TestEditorPage() {
    const navigate = useNavigate();

    const handleClose = () => {
        navigate('/');
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-background">
            <div className="p-2 border-b flex items-center gap-4 bg-white">
                <Button variant="ghost" size="sm" onClick={handleClose}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Button>
                <h1 className="font-bold text-lg">Native Editor Test Preview</h1>
                <div className="ml-auto text-xs text-muted-foreground">
                    Debug Mode: Native Canvas Rendering
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
                <NativeDocxEditor />
            </div>
        </div>
    );
}
