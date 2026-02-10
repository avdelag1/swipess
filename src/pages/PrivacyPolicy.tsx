import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Sticky Header */}
      <div className="flex-shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-8">Last Updated: November 23, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Profile information (name, age, photos, bio)</li>
              <li>Location preferences and search criteria</li>
              <li>Messages and communications with other users</li>
              <li>Property listings and preferences</li>
              <li>Payment and subscription information</li>
              <li>Device information and usage data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Provide and improve our matching services</li>
              <li>Connect property owners with potential clients</li>
              <li>Process transactions and subscriptions</li>
              <li>Send notifications about matches and messages</li>
              <li>Analyze usage patterns and enhance user experience</li>
              <li>Prevent fraud and ensure platform security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Data Sharing and Disclosure</h2>
            <p className="mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Other Users:</strong> Profile information is visible to other users for matching purposes</li>
              <li><strong>Service Providers:</strong> Supabase (database hosting), Google (authentication)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
            </ul>
            <p className="mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Your Rights and Choices</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct your information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Object:</strong> Object to certain data processing activities</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at privacy@swipess.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>End-to-end encryption for sensitive data</li>
              <li>Secure authentication with OAuth 2.0</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and monitoring</li>
              <li>Secure cloud infrastructure (Supabase)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
            <p className="mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze site traffic and usage</li>
              <li>Improve platform performance</li>
            </ul>
            <p className="mt-4">
              You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
            <p className="mb-4">
              Our service is not intended for users under 18 years of age. We do not knowingly collect
              information from children. If you believe we have collected information from a minor,
              please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place for international data transfers in
              compliance with GDPR and other applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Data Retention</h2>
            <p className="mb-4">
              We retain your information for as long as necessary to provide our services and comply
              with legal obligations. When you delete your account, we will delete or anonymize your
              personal information within 30 days, except where retention is required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes via email or through the platform. Your continued use of our service after
              changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="mb-4">
              For privacy-related questions or requests, contact us at:
            </p>
            <ul className="list-none pl-0 mb-4 space-y-2">
              <li><strong>Email:</strong> privacy@swipess.com</li>
              <li><strong>Data Protection Officer:</strong> dpo@swipess.com</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. GDPR & CCPA Compliance</h2>
            <p className="mb-4">
              <strong>For EU Users (GDPR):</strong> You have rights under the General Data Protection
              Regulation, including rights to access, rectification, erasure, and data portability.
            </p>
            <p className="mb-4">
              <strong>For California Users (CCPA):</strong> You have the right to know what personal
              information is collected, to delete your information, and to opt-out of the sale of
              personal information (we do not sell personal information).
            </p>
          </section>
          </div>
        </div>
      </ScrollArea>

      {/* Sticky Footer Button */}
      <div className="flex-shrink-0 sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate(-1)}
            className="w-full rounded-xl h-12"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
