import { Toaster as Sonner, toast as sonnerToast } from "sonner"
import useAppTheme from "@/hooks/useAppTheme"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useAppTheme();

  return (
    <Sonner
      theme={theme === 'dark' ? 'dark' : 'light'}
      className="toaster group"
      position="bottom-center"
      style={{ bottom: 'calc(var(--safe-bottom, 0px) + 84px)', zIndex: 10005 }}
      // Only show 1 toast at a time — no stack-up
      visibleToasts={1}
      // Default swipe to dismiss
      // Close immediately on swipe — no threshold delay
      closeButton={false}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-900/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-[0_4px_20px_rgba(0,0,0,0.35)] group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3.5 group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-white/20",
          description: "group-[.toast]:text-white/55 group-[.toast]:text-xs group-[.toast]:mt-0.5",
          actionButton:
            "group-[.toast]:bg-white/15 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-medium hover:group-[.toast]:bg-white/20 transition-colors",
          cancelButton:
            "group-[.toast]:bg-white/8 group-[.toast]:text-white/70 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 hover:group-[.toast]:bg-white/12",
          title: "group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:text-sm group-[.toast]:tracking-normal",
          icon: "group-[.toast]:w-4 group-[.toast]:h-4 group-[.toast]:opacity-80",
          success: "group-[.toaster]:border-l-emerald-500",
          error: "group-[.toaster]:border-l-red-500",
          warning: "group-[.toaster]:border-l-amber-400",
          info: "group-[.toaster]:border-l-sky-400",
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


