import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { changeLanguage as i18nChangeLanguage } from '@/i18n/index';

const languages = [
  { code: 'en', label: 'English',  nativeLabel: 'English',   flag: '🇺🇸' },
  { code: 'es', label: 'Spanish',  nativeLabel: 'Español',   flag: '🇲🇽' },
  { code: 'it', label: 'Italian',  nativeLabel: 'Italiano',  flag: '🇮🇹' },
  { code: 'ru', label: 'Russian',  nativeLabel: 'Русский',   flag: '🇷🇺' },
];

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const [current, setCurrent] = useState(i18n.language);

  const switchLanguage = async (code: string) => {
    setCurrent(code);
    await i18nChangeLanguage(code);

    if (user) {
      await supabase
        .from('profiles')
        .update({ language: code })
        .eq('user_id', user.id);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Globe className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">{t('settings.language')}</h4>
          <p className="text-[11px] text-muted-foreground">{t('settings.languageDesc')}</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            whileTap={{ scale: 0.93 }}
            onClick={() => switchLanguage(lang.code)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-xl border text-center transition-all",
              current === lang.code
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-card/50 border-border text-muted-foreground hover:bg-card/80 hover:text-foreground"
            )}
          >
            <span className="text-xl leading-none">{lang.flag}</span>
            <span className="text-[10px] font-semibold leading-tight truncate w-full text-center">
              {lang.nativeLabel}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}


