import * as React from "react"
import { Root, Trigger, Portal, Close, Overlay, Content, Title, Description } from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Dialog that prevents body scroll shift
const Dialog = ({ children, ...props }: React.ComponentPropsWithoutRef<typeof Root>) => (
  <Root {...props}>
    {children}
  </Root>
)

const DialogTrigger = Trigger

const DialogPortal = Portal

const DialogClose = Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof Overlay>,
  React.ComponentPropsWithoutRef<typeof Overlay>
>(({ className, ...props }, ref) => (
  <Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[10001] bg-black/60 backdrop-blur-xl pointer-events-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-100",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = Overlay.displayName

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof Content> {
  hideOverlay?: boolean;
  overlayClassName?: string;
  hideCloseButton?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof Content>,
  DialogContentProps
>(({ className, children, hideOverlay, overlayClassName, hideCloseButton, ...props }, ref) => (
  <DialogPortal>
    {!hideOverlay && <DialogOverlay className={overlayClassName} />}
    <Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[10002] grid w-[calc(100%-24px)] max-w-lg max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-5 border border-white/10 bg-background p-5 sm:p-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.5)] duration-200 ease-out pointer-events-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-[32px] overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <Close className="absolute right-3 top-3 sm:right-5 sm:top-5 h-10 w-10 flex items-center justify-center rounded-full opacity-100 transition-all focus:outline-none disabled:pointer-events-none hover:bg-secondary/50 active:scale-90 z-[10010]">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Close>
      )}
    </Content>
  </DialogPortal>
))
DialogContent.displayName = Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof Title>,
  React.ComponentPropsWithoutRef<typeof Title>
>(({ className, ...props }, ref) => (
  <Title
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-tight tracking-[-0.01em]",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof Description>,
  React.ComponentPropsWithoutRef<typeof Description>
>(({ className, ...props }, ref) => (
  <Description
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed tracking-[0.01em]", className)}
    {...props}
  />
))
DialogDescription.displayName = Description.displayName

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

