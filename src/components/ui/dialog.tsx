import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({ open: false, onOpenChange: () => {} });

const Dialog = ({ open, onOpenChange, children }: any) => {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, any>(({ children, asChild: _asChild, ...props }, _ref) => {
  const { onOpenChange } = React.useContext(DialogContext);
  return React.cloneElement(children, {
    onClick: (e: any) => {
      if (children.props.onClick) children.props.onClick(e);
      onOpenChange(true);
    },
    ...props
  })
})
DialogTrigger.displayName = "DialogTrigger"

const DialogPortal = ({ children }: any) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {children}
    </AnimatePresence>,
    document.body
  );
}

const DialogOverlay = React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => {
  const { onOpenChange } = React.useContext(DialogContext);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      onClick={() => onOpenChange(false)}
      className={cn("fixed inset-0 z-[10001] modal-scrim", className)}
      {...props}
    />
  )
})
DialogOverlay.displayName = "DialogOverlay"

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  hideOverlay?: boolean;
  overlayClassName?: string;
  hideCloseButton?: boolean;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(({ className, children, hideOverlay, overlayClassName, hideCloseButton, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(DialogContext);

  return (
    <DialogPortal>
      {open && !hideOverlay && (
        <DialogOverlay key="overlay" className={overlayClassName} />
      )}
      {open && (
        <motion.div
          key="content"
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[10002] flex items-center justify-center pointer-events-none"
        >
          <div
            ref={ref}
            className={cn(
              "relative w-full max-w-lg max-h-[90vh] border border-border bg-card chrome-solid surface-5 p-5 sm:p-[28px] pointer-events-auto rounded-[32px] overflow-hidden",
              className
            )}
            {...props}
          >
          {children}
          {!hideCloseButton && (
            <button onClick={() => onOpenChange(false)} className="absolute right-3 top-3 sm:right-5 sm:top-5 h-10 w-10 flex items-center justify-center rounded-full opacity-100 focus:outline-none hover:bg-secondary/50 press-snappy z-[10010] bg-black/10 dark:bg-white/10 text-foreground/70">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          )}
          </div>
        </motion.div>
      )}
    </DialogPortal>
  )
});
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-xl font-semibold leading-tight tracking-[-0.01em]", className)} {...props} />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground leading-relaxed tracking-[0.01em]", className)} {...props} />
))
DialogDescription.displayName = "DialogDescription"

const DialogClose = React.forwardRef<HTMLButtonElement, any>(({ className, children, ...props }, ref) => {
  const { onOpenChange } = React.useContext(DialogContext);
  return (
    <button ref={ref} className={className} onClick={() => onOpenChange(false)} {...props}>
      {children}
    </button>
  )
})
DialogClose.displayName = "DialogClose"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

