import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AGLPage() {
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
          <h1 className="text-lg font-semibold">AGL - Acceptable Use Guidelines</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-8">Last Updated: January 24, 2026</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                These Acceptable Use Guidelines (AGL) outline the standards of conduct expected from all
                users of Swipess. By using our platform, you agree to follow these guidelines to ensure
                a safe, respectful, and productive experience for everyone.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Community Standards</h2>
              <p className="mb-4">All users must:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Treat all users with respect and dignity</li>
                <li>Communicate honestly and transparently</li>
                <li>Honor commitments and agreements made through the platform</li>
                <li>Maintain professional conduct in all interactions</li>
                <li>Report any violations or concerns to our support team</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Property Owner Guidelines</h2>
              <p className="mb-4">Property owners and service providers must:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Provide accurate and up-to-date listing information</li>
                <li>Use genuine photos that accurately represent the property</li>
                <li>Respond to inquiries in a timely manner (within 48 hours)</li>
                <li>Honor pricing and terms as advertised</li>
                <li>Maintain properties to safe and habitable standards</li>
                <li>Comply with all local housing laws and regulations</li>
                <li>Not discriminate based on protected characteristics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Client Guidelines</h2>
              <p className="mb-4">Clients and renters must:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Provide truthful profile information</li>
                <li>Communicate rental needs clearly and honestly</li>
                <li>Show up for scheduled viewings or provide advance notice</li>
                <li>Respect property during viewings</li>
                <li>Honor rental commitments once agreed upon</li>
                <li>Provide fair and honest reviews based on actual experience</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Prohibited Content</h2>
              <p className="mb-4">The following content is strictly prohibited:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>False or misleading information</li>
                <li>Offensive, discriminatory, or hateful content</li>
                <li>Adult or sexually explicit material</li>
                <li>Violent or threatening content</li>
                <li>Spam or unsolicited commercial messages</li>
                <li>Content that infringes on intellectual property rights</li>
                <li>Personal information of others without consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Prohibited Activities</h2>
              <p className="mb-4">The following activities are strictly prohibited:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Harassment, stalking, or intimidation</li>
                <li>Scams, fraud, or deceptive practices</li>
                <li>Discrimination in housing based on protected characteristics</li>
                <li>Circumventing platform fees or safety features</li>
                <li>Creating multiple accounts for deceptive purposes</li>
                <li>Automated access or scraping without permission</li>
                <li>Money laundering or illegal financial activities</li>
                <li>Using the platform for illegal activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Rating and Review Guidelines</h2>
              <p className="mb-4">When leaving ratings and reviews:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Only rate users you have actually interacted with</li>
                <li>Be honest and fair in your assessments</li>
                <li>Focus on the relevant aspects of your experience</li>
                <li>Avoid personal attacks or defamatory statements</li>
                <li>Do not offer incentives for positive reviews</li>
                <li>Do not post fake or manipulated reviews</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Communication Guidelines</h2>
              <p className="mb-4">When communicating through the platform:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Keep conversations professional and on-topic</li>
                <li>Do not share personal contact information until appropriate</li>
                <li>Respond to messages within reasonable timeframes</li>
                <li>Do not send unsolicited messages to users</li>
                <li>Use the messaging system for legitimate rental inquiries</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Safety and Security</h2>
              <p className="mb-4">To maintain safety on our platform:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Verify the identity of users before meeting in person</li>
                <li>Meet in public places for initial meetings when possible</li>
                <li>Report suspicious behavior immediately</li>
                <li>Do not share passwords or account credentials</li>
                <li>Be cautious of requests for payments outside the platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Enforcement</h2>
              <p className="mb-4">
                Violations of these guidelines may result in:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Warning notifications</li>
                <li>Temporary suspension of account features</li>
                <li>Permanent account suspension</li>
                <li>Removal of content or listings</li>
                <li>Legal action where appropriate</li>
              </ul>
              <p className="mb-4">
                We investigate all reported violations and take appropriate action based on the
                severity and frequency of the violation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Reporting Violations</h2>
              <p className="mb-4">
                If you witness or experience a violation of these guidelines:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Use the Report function on user profiles or listings</li>
                <li>Contact our support team at support@swipess.com</li>
                <li>Provide as much detail as possible about the violation</li>
                <li>Include screenshots or evidence when available</li>
              </ul>
              <p className="mb-4">
                All reports are reviewed confidentially, and we do not disclose the identity of
                reporters to reported users.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Appeals</h2>
              <p className="mb-4">
                If your account has been suspended or content has been removed, you may appeal
                the decision by contacting our support team with:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Your account information</li>
                <li>The reason for the enforcement action</li>
                <li>Any additional context or information</li>
              </ul>
              <p className="mb-4">
                Appeals are reviewed within 5 business days, and decisions are communicated
                via email.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Updates to Guidelines</h2>
              <p className="mb-4">
                We may update these guidelines from time to time. Significant changes will be
                communicated through the platform or via email. Continued use of our services
                after updates constitutes acceptance of the revised guidelines.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
              <p className="mb-4">
                For questions about these Acceptable Use Guidelines, contact us at:
              </p>
              <ul className="list-none pl-0 mb-4 space-y-2">
                <li><strong>Email:</strong> support@swipess.com</li>
                <li><strong>Legal:</strong> legal@swipess.com</li>
              </ul>
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
