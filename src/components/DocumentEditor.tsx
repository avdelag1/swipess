import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Undo, Redo, Download, Printer, FileText,
  Type, Minus, Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentEditorProps {
  initialContent?: string;
  title?: string;
  onSave?: (content: string, title: string) => void;
  readOnly?: boolean;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  initialContent = '',
  title: initialTitle = 'Untitled Document',
  onSave,
  readOnly = false
}) => {
  const [documentTitle, setDocumentTitle] = useState(initialTitle);
  const [fontSize, setFontSize] = useState(14);
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handlePrint = () => {
    const content = editorRef.current?.innerHTML || '';
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${documentTitle}</title>
            <style>
              body {
                font-family: 'Times New Roman', serif;
                padding: 40px;
                line-height: 1.6;
              }
              h1 { text-align: center; margin-bottom: 30px; }
            </style>
          </head>
          <body>
            <h1>${documentTitle}</h1>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportPDF = () => {
    handlePrint();
    toast.success('Print dialog opened - Save as PDF from your browser');
  };

  const handleSave = () => {
    const content = editorRef.current?.innerHTML || '';
    onSave?.(content, documentTitle);
    toast.success('Document saved!');
  };

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 32));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 10));

  return (
    <Card className="w-full h-full flex flex-col bg-white">
      <CardHeader className="shrink-0 pb-2">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <Input
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="text-lg font-semibold border-none focus-visible:ring-0 p-0 h-auto"
            placeholder="Document Title"
            readOnly={readOnly}
          />
        </div>
      </CardHeader>

      {/* Toolbar */}
      {!readOnly && (
        <div className="shrink-0 px-4 pb-2 space-y-2">
          {/* Text Formatting */}
          <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('bold')}
              className="h-8 w-8 p-0"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('italic')}
              className="h-8 w-8 p-0"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('underline')}
              className="h-8 w-8 p-0"
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyLeft')}
              className="h-8 w-8 p-0"
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyCenter')}
              className="h-8 w-8 p-0"
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyRight')}
              className="h-8 w-8 p-0"
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('insertUnorderedList')}
              className="h-8 w-8 p-0"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('insertOrderedList')}
              className="h-8 w-8 p-0"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={decreaseFontSize}
                className="h-8 w-8 p-0"
                title="Decrease Font Size"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-sm w-8 text-center">{fontSize}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={increaseFontSize}
                className="h-8 w-8 p-0"
                title="Increase Font Size"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('undo')}
              className="h-8 w-8 p-0"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('redo')}
              className="h-8 w-8 p-0"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-1" />
              Export PDF
            </Button>
            {onSave && (
              <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                Save Document
              </Button>
            )}
          </div>
        </div>
      )}

      <Separator />

      {/* Editor Area */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div
            ref={editorRef}
            contentEditable={!readOnly}
            className="min-h-[500px] p-6 outline-none"
            style={{
              fontFamily: "'Times New Roman', serif",
              fontSize: `${fontSize}px`,
              lineHeight: '1.6'
            }}
            dangerouslySetInnerHTML={{ __html: initialContent }}
            suppressContentEditableWarning
          />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
