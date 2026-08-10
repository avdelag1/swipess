/* eslint-disable react-refresh/only-export-components */
import { Toaster as Sonner, toast as sonnerToast } from "sonner"
import useAppTheme from "@/hooks/useAppTheme"

import { createPortal } from "react-dom"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useAppTheme();

  return createPortal(
    <Sonner
      theme={theme === 'dark' ? 'dark' : 'light'}
      className="toaster group"
      position="top-center"
      style={{ top: 'var(--safe-top, 20px)', zIndex: 2147483000 }}
      visibleToasts={2}
      closeButton={false}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] group-[.toaster]:rounded-3xl group-[.toaster]:px-5 group-[.toaster]:py-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all !z-[2147483000]",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:text-xs group-[.toast]:font-bold hover:group-[.toast]:opacity-90 transition-opacity shadow-lg shadow-primary/25",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl group-[.toast]:px-4 group-[.toast]:py-2 hover:group-[.toast]:bg-muted/80",
          title: "group-[.toast]:text-foreground group-[.toast]:font-black group-[.toast]:text-sm group-[.toast]:tracking-tight",
          icon: "group-[.toast]:w-5 group-[.toast]:h-5 group-[.toast]:opacity-90",
          success: "group-[.toast]:border-green-500/30 group-[.toast]:bg-green-500/10",
          error: "group-[.toast]:border-red-500/30 group-[.toast]:bg-red-500/10",
          warning: "group-[.toast]:border-orange-500/30 group-[.toast]:bg-orange-500/10",
          info: "group-[.toast]:border-blue-500/30 group-[.toast]:bg-blue-500/10",
        },
      }}
      {...props}
    />,
    document.body
  )
}

// Compatibility wrapper: accepts both old shadcn {title,description,variant} and new sonner syntax
type OldToastArgs = {
  title?: string;
  description?: string;
  variant?: string;
  duration?: number;
};

function isOldSyntax(arg: unknown): arg is OldToastArgs {
  return typeof arg === 'object' && arg !== null && 'title' in arg;
}

const injectOnClick = (title: string, opts: any = {}) => {
  if (!opts.onClick && !opts.action) {
    opts.onClick = () => {
      window.dispatchEvent(new CustomEvent('open-notification-details', {
        detail: {
          type: 'info',
          title: title || 'Notification',
          message: opts.description || title,
          timestamp: Date.now()
        }
      }));
    };
  }
  return opts;
};

const toast = Object.assign(
  (messageOrOptions: any, data?: any) => {
    if (isOldSyntax(messageOrOptions)) {
      const { title, description, variant, duration } = messageOrOptions;
      const opts: any = {};
      if (description) opts.description = description;
      if (duration) opts.duration = duration;
      const finalOpts = injectOnClick(title || 'Notification', opts);
      if (variant === 'destructive') return sonnerToast.error(title || 'Error', finalOpts);
      return sonnerToast(title || '', finalOpts);
    }
    return sonnerToast(messageOrOptions, injectOnClick(messageOrOptions, data));
  },
  {
    success: (msg: string | React.ReactNode, data?: any) => sonnerToast.success(msg, injectOnClick(msg as string, data)),
    error: (msg: string | React.ReactNode, data?: any) => sonnerToast.error(msg, injectOnClick(msg as string, data)),
    warning: (msg: string | React.ReactNode, data?: any) => sonnerToast.warning(msg, injectOnClick(msg as string, data)),
    info: (msg: string | React.ReactNode, data?: any) => sonnerToast.info(msg, injectOnClick(msg as string, data)),
    loading: sonnerToast.loading,
    promise: sonnerToast.promise,
    dismiss: sonnerToast.dismiss,
    message: sonnerToast.message,
    custom: sonnerToast.custom,
  }
);

export { Toaster, toast }


