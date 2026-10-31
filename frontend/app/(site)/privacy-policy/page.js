import PolicyShell from "@/components/site/PolicyShell";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How Nixie protects, collects, and manages your personal data, measurements, reference photos, and transaction details.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyShell
      title="Privacy Policy"
      subtitle="Your privacy and personal information are treated with the highest degree of respect and security at Nixie."
      lastUpdated="October 2026"
    >
      <div className="space-y-10">
        <section>
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">1. Introduction</h2>
          <p className="mt-3 text-muted">
            This Privacy Policy explains how Nixie (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, and safeguards your
            personal information when you visit our website, use our AI outfit analysis tools, submit custom design
            inquiries, or purchase bespoke garments.
          </p>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">2. Information We Collect</h2>
          <p className="mt-3 text-muted">
            To provide tailored fashion design and precision tailoring, we may collect the following information:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>
              <strong className="text-ink">Contact Details:</strong> Full name, email address, contact phone number, and physical shipping address.
            </li>
            <li>
              <strong className="text-ink">Custom Sizing &amp; Measurements:</strong> Precise body measurements, fit preferences, and specific garment alteration notes.
            </li>
            <li>
              <strong className="text-ink">Inspiration Media:</strong> Photos, sketches, or screenshot references you upload for AI pricing analysis or design inquiries.
            </li>
            <li>
              <strong className="text-ink">Order &amp; Billing History:</strong> Invoices, transaction statuses, order tracking identifiers, and payment receipts.
            </li>
          </ul>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">3. How We Use Your Information</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>To generate automated AI price estimates and style breakdowns for uploaded inspirations.</li>
            <li>To tailor, stitch, and finish custom garments according to your verified measurements and approvals.</li>
            <li>To dispatch shipments and provide real-time tracking updates via SMS and email.</li>
            <li>To verify authorized customer and administrative logins with secure session handling.</li>
            <li>To address design inquiries, alteration requests, and customer support conversations.</li>
          </ul>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">4. Payment Security</h2>
          <p className="mt-3 text-muted">
            All online transactions on Nixie are processed through certified, PCI-DSS compliant payment gateways
            (Cashfree Payments). We do not store, view, or retain your raw debit/credit card numbers, CVVs, or UPI MPINs on our servers.
          </p>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">5. Third-Party Service Providers</h2>
          <p className="mt-3 text-muted">
            We share only essential data with trusted infrastructure partners strictly necessary to run our studio:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
            <li><strong className="text-ink">Logistics Partners:</strong> Delivery carriers (for shipping and reverse pickup verification).</li>
            <li><strong className="text-ink">Secure Media Hosting:</strong> ImageKit (for encrypted storage and fast CDN delivery of garment images).</li>
            <li><strong className="text-ink">Transactional Messaging:</strong> Automated email delivery services (for invoices, OTP codes, and password reset links).</li>
          </ul>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">6. Cookies &amp; Session Data</h2>
          <p className="mt-3 text-muted">
            We use strictly necessary httpOnly cookies to securely authenticate your customer account session and maintain
            your shopping cart or invoice status. We do not use third-party cross-site trackers or sell your personal data.
          </p>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">7. Your Rights &amp; Retention</h2>
          <p className="mt-3 text-muted">
            You may request access to, correction of, or deletion of your personal account data at any time by contacting our
            privacy officer. We retain customer transaction and invoice data only for the legally mandated period required
            under Indian accounting and tax regulations.
          </p>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">8. Contact &amp; Grievance Office</h2>
          <div className="mt-4 rounded-xl border border-line bg-mint/30 p-5 text-[14.5px] text-muted">
            <p className="font-semibold text-ink">Nixie Studio</p>
            <p className="mt-1">Attn: Aishwarya Deogade</p>
            <p>302, Radheya Apartment, Giripeth, Nagpur, Maharashtra - 440010, India</p>
            <p className="mt-2">
              Email:{" "}
              <a href="mailto:aishwarya@thenixie.in" className="font-medium text-teal-deep hover:underline">
                aishwarya@thenixie.in
              </a>
            </p>
            <p>Phone: +91 8855014059</p>
          </div>
        </section>
      </div>
    </PolicyShell>
  );
}
