import { AmbientPageBackground } from "@/components/ui/AmbientPageBackground";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ContactPage() {
  const { t } = useTranslation();
  return (
    <AmbientPageBackground className="min-h-screen text-foreground pt-14 pb-24">
      <PageHeader
        title={t("contact.title", "Contact Support")}
        description={t("contact.description", "We are here to help you.")}
      />
      <div className="max-w-2xl mx-auto px-6 mt-8 space-y-6">
        <div className="p-8 rounded-3xl border border-border bg-card/40 backdrop-blur-md shadow-2xl text-center space-y-4">
          <MessageSquare className="w-12 h-12 text-brand-primary mx-auto mb-4" />
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            {t("contact.needHelp", "Need Assistance?")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("contact.text", "If you have any questions, encounter a bug, or need help with your account, please reach out to our support team directly via email.")}
          </p>
          <Button
            onClick={() => window.location.href = "mailto:support@swipess.com"}
            className="w-full sm:w-auto h-14 px-8 rounded-full bg-brand-primary text-white font-black uppercase tracking-widest"
          >
            <Mail className="w-5 h-5 mr-2" />
            Email Support
          </Button>
        </div>
      </div>
    </AmbientPageBackground>
  );
}
