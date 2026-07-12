import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

interface DraggablePhotoGridProps {
  photos: string[];                      // blob/remote URLs
  onReorder: (newOrder: string[]) => void;
  onRemove: (index: number) => void;
  isLight?: boolean;
  /** Slot appended after photos for the add-more button */
  addSlot?: React.ReactNode;
}

/**
 * A 2-column (mobile) / 3-column (tablet) photo grid that supports
 * free drag-reorder via framer-motion Reorder.
 *
 * – Long-press (pointer down on the grip handle) starts the drag.
 * – Dragged item lifts with a scale + shadow.
 * – Other items slide into the vacated slot.
 * – Position 0 always shows a "Cover" badge.
 */
function PhotoItem({
  photo,
  index,
  isLight,
  onRemove,
}: {
  photo: string;
  index: number;
  isLight: boolean;
  onRemove: () => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={photo}
      dragListener={false}
      dragControls={controls}
      className="relative aspect-square list-none"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      whileDrag={{
        scale: 1.08,
        boxShadow: '0 28px 60px rgba(0,0,0,0.45)',
        zIndex: 50,
        cursor: 'grabbing',
      }}
    >
      <div
        className={cn(
          'w-full h-full rounded-[1.5rem] overflow-hidden border-2 relative group select-none shadow-lg',
          index === 0
            ? 'border-[#8B5CF6]/60 shadow-[0_0_20px_rgba(139,92,246,0.2)]'
            : isLight
            ? 'border-slate-200'
            : 'border-white/10'
        )}
      >
        {/* Photo */}
        <img
          src={photo}
          alt={`Photo ${index + 1}`}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Cover badge */}
        {index === 0 && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-[#8B5CF6] rounded-full px-2.5 py-1 shadow-lg pointer-events-none">
            <Star className="w-3 h-3 text-white fill-white" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white">Cover</span>
          </div>
        )}

        {/* Remove button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('medium');
            onRemove();
          }}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/70 hover:bg-red-500/90 rounded-full border border-white/20 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 z-10"
          aria-label="Remove photo"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>

        {/* Drag handle — entire bottom strip so it's easy to grab on mobile */}
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            triggerHaptic('light');
            controls.start(e);
          }}
          className="absolute bottom-0 inset-x-0 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none z-10"
          aria-label="Drag to reorder"
        >
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-full px-3 py-1 border border-white/10">
            <GripVertical className="w-3.5 h-3.5 text-white/80" />
            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Hold & drag</span>
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}

export function DraggablePhotoGrid({
  photos,
  onReorder,
  onRemove,
  isLight = false,
  addSlot,
}: DraggablePhotoGridProps) {
  if (photos.length === 0 && !addSlot) return null;

  return (
    <Reorder.Group
      axis="y"
      values={photos}
      onReorder={(newOrder) => {
        triggerHaptic('light');
        onReorder(newOrder);
      }}
      // We override the default column layout via CSS grid but Reorder.Group
      // renders a ul — give it a grid layout so items wrap into columns.
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        listStyle: 'none',
        padding: 0,
        margin: 0,
      }}
      className="sm:grid-cols-3"
    >
      {photos.map((photo, i) => (
        <PhotoItem
          key={photo}
          photo={photo}
          index={i}
          isLight={isLight}
          onRemove={() => onRemove(i)}
        />
      ))}

      {/* Add-more slot rendered as an extra grid cell */}
      {addSlot && (
        <li className="aspect-square list-none">
          {addSlot}
        </li>
      )}
    </Reorder.Group>
  );
}
