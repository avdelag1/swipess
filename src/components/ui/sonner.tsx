import { Toaster as Sonner, toast as sonnerToast } from "sonner"
import { useTheme } from "@/hooks/useTheme"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black/90 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-[0_8px_32px_rgba(0,0,0,0.5)] group-[.toaster]:rounded-3xl group-[.toaster]:px-5 group-[.toaster]:py-4 group-[.toaster]:border-l-4 group-[.toaster]:border-l-brand-accent-2",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:font-bold group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-brand-accent-2 group-[.toast]:text-white group-[.toast]:rounded-xl group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-black group-[.toast]:text-[10px] group-[.toast]:uppercase group-[.toast]:tracking-wider hover:group-[.toast]:scale-105 active:group-[.toast]:scale-95 transition-all",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white group-[.toast]:rounded-xl group-[.toast]:px-4 group-[.toast]:py-2 hover:group-[.toast]:bg-white/20",
          title: "group-[.toast]:text-white group-[.toast]:font-black group-[.toast]:text-sm group-[.toast]:uppercase group-[.toast]:tracking-tight",
          icon: "group-[.toast]:w-5 group-[.toast]:h-5 group-[.toast]:text-brand-accent-2",
          success: "group-[.toaster]:border-l-emerald-500",
          error: "group-[.toaster]:border-l-rose-500",
          warning: "group-[.toaster]:border-l-amber-500",
          info: "group-[.toaster]:border-l-cyan-500",
        },
      }}
      {...props}
    />
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

const toast = Object.assign(
  (messageOrOptions: any, data?: any) => {
    if (isOldSyntax(messageOrOptions)) {
      const { title, description, variant, duration } = messageOrOptions;
      const opts: any = {};
      if (description) opts.description = description;
      if (duration) opts.duration = duration;
      if (variant === 'destructive') return sonnerToast.error(title || 'Error', opts);
      return sonnerToast(title || '', opts);
    }
    return sonnerToast(messageOrOptions, data);
  },
  {
    success: sonnerToast.success,
    error: sonnerToast.error,
    warning: sonnerToast.warning,
    info: sonnerToast.info,
    loading: sonnerToast.loading,
    promise: sonnerToast.promise,
    dismiss: sonnerToast.dismiss,
    message: sonnerToast.message,
    custom: sonnerToast.custom,
  }
);

export { Toaster, toast }
