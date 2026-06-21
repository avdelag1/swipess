import type { ReactNode } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, Bold, FileDown, Italic,
  List, ListOrdered, Minus, Plus, Printer, Redo, Underline, Undo, Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

import type { DocumentFontId } from '@/lib/document-fonts';
import { DOCUMENT_FONTS } from '@/lib/document-fonts';

interface DocumentEditorToolbarProps {
  fontSize: number;
  fontFamily: DocumentFontId;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (family: DocumentFontId) => void;
  onFormat: (command: string, value?: string) => void;
  onDownloadPDF?: () => void;
  onDownloadWord?: () => void;
  onImproveAI?: () => void;
  isEnhancing?: boolean;
  className?: string;
}

function ToolButton({
  onClick,
  label,
  children,
  active,
  accent,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  active?: boolean;
  accent?: boolean;
}) {
  const { isLight } = useAppTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'h-8 min-w-8 px-2 rounded-lg flex items-center justify-center border transition-colors active:scale-95',
        accent
          ? 'bg-primary text-white border-primary'
          : active
            ? (isLight ? 'bg-slate-100 border-slate-300 text-black' : 'bg-white/15 border-white/20 text-white')
            : (isLight ? 'bg-slate-50 border-slate-200 text-black' : 'bg-white/5 border-white/10 text-white'),
      )}
    >
      {children}
    </button>
  );
}

export function DocumentEditorToolbar({
  fontSize,
  fontFamily,
  onFontSizeChange,
  onFontFamilyChange,
  onFormat,
  onDownloadPDF,
  onDownloadWord,
  onImproveAI,
  isEnhancing,
  className,
}: DocumentEditorToolbarProps) {
  const { isLight } = useAppTheme();

  return (
    <div className={cn('space-y-2', className)}>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5 flex-wrap min-w-max pb-1">
          <ToolButton onClick={() => onFormat('bold')} label="Bold"><Bold className="w-3.5 h-3.5" /></ToolButton>
          <ToolButton onClick={() => onFormat('italic')} label="Italic"><Italic className="w-3.5 h-3.5" /></ToolButton>
          <ToolButton onClick={() => onFormat('underline')} label="Underline"><Underline className="w-3.5 h-3.5" /></ToolButton>

          <div className={cn('w-px h-5', isLight ? 'bg-black/10' : 'bg-white/10')} />

          <ToolButton onClick={() => onFormat('justifyLeft')} label="Align left"><AlignLeft className="w-3.5 h-3.5" /></ToolButton>
          <ToolButton onClick={() => onFormat('justifyCenter')} label="Align center"><AlignCenter className="w-3.5 h-3.5" /></ToolButton>
          <ToolButton onClick={() => onFormat('justifyRight')} label="Align right"><AlignRight className="w-3.5 h-3.5" /></ToolButton>

          <div className={cn('w-px h-5', isLight ? 'bg-black/10' : 'bg-white/10')} />

          <ToolButton onClick={() => onFormat('insertUnorderedList')} label="Bullet list"><List className="w-3.5 h-3.5" /></ToolButton>
          <ToolButton onClick={() => onFormat('insertOrderedList')} label="Numbered list"><ListOrdered className="w-3.5 h-3.5" /></ToolButton>

          <div className={cn('w-px h-5', isLight ? 'bg-black/10' : 'bg-white/10')} />

          <div className="flex items-center gap-1">
            <ToolButton onClick={() => onFontSizeChange(Math.max(10, fontSize - 2))} label="Decrease font size">
              <Minus className="w-3.5 h-3.5" />
            </ToolButton>
            <span className={cn('text-[11px] font-black w-8 text-center tabular-nums', isLight ? 'text-black/70' : 'text-white/70')}>{fontSize}</span>
            <ToolButton onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))} label="Increase font size">
              <Plus className="w-3.5 h-3.5" />
            </ToolButton>
          </div>

          <select
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value as DocumentFontId)}
            aria-label="Font family"
            className={cn(
              'h-8 rounded-lg border px-2 text-[10px] font-bold uppercase tracking-wide outline-none',
              isLight ? 'bg-slate-50 border-slate-200 text-black' : 'bg-white/5 border-white/10 text-white',
            )}
          >
            {DOCUMENT_FONTS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>

          <div className={cn('w-px h-5', isLight ? 'bg-black/10' : 'bg-white/10')} />

          <ToolButton onClick={() => onFormat('undo')} label="Undo"><Undo className="w-3.5 h-3.5" /></ToolButton>
          <ToolButton onClick={() => onFormat('redo')} label="Redo"><Redo className="w-3.5 h-3.5" /></ToolButton>

          {onImproveAI && (
            <>
              <div className={cn('w-px h-5', isLight ? 'bg-black/10' : 'bg-white/10')} />
              <button
                type="button"
                onClick={onImproveAI}
                disabled={isEnhancing}
                className="h-8 px-3 rounded-lg flex items-center gap-1.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest disabled:opacity-60 active:scale-95 transition-transform"
              >
                <Wand2 className="w-3.5 h-3.5" />{isEnhancing ? 'Polishing…' : 'AI Polish'}
              </button>
            </>
          )}

          {(onDownloadPDF || onDownloadWord) && (
            <>
              <div className={cn('w-px h-5', isLight ? 'bg-black/10' : 'bg-white/10')} />
              {onDownloadPDF && (
                <ToolButton onClick={onDownloadPDF} label="Download PDF"><Printer className="w-3.5 h-3.5" /></ToolButton>
              )}
              {onDownloadWord && (
                <ToolButton onClick={onDownloadWord} label="Download Word"><FileDown className="w-3.5 h-3.5" /></ToolButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
