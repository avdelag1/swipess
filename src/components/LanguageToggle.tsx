import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [current, setCurrent] = useState(i18n.language);

  const switchLanguage = async (code: string) => {
    setCurrent(code);
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);

    if (user) {
      await supabase
        .from('profiles')
        .update({ language: code })
        .eq('user_id', user.id);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Globe className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">Language</h4>
          <p className="text-[11px] text-muted-foreground">Choose your preferred language</p>
        </div>
      </div>
      <div className="flex gap-2">
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            whileTap={{ scale: 0.96 }}
            onClick={() => switchLanguage(lang.code)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all",
              current === lang.code
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-card/50 border-border text-muted-foreground hover:bg-card/80"
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
