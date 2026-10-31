import PolicyShell from "@/components/site/PolicyShell";
import Link from "next/link";

export const metadata = {
  title: "Return, Alteration & Refund Policy",
  description:
    "Official policy on returns, alterations, store credit, and order cancellations for Nixie bespoke custom garments.",
};

export default function RefundPolicyPage() {
  return (
    <PolicyShell
      title="Return, Alteration & Refund Policy"
      subtitle="At Nixie, every piece is made to order — crafted specially for your measurements after your purchase. We stand behind our quality, fit, and honest craftsmanship."
      lastUpdated="October 2026"
    >
      <div className="space-y-10">
        <section>
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">1. Made-to-Order & Refund Policy</h2>
          <p className="mt-3 text-muted">
            Because each garment is individually drafted, cut, and stitched exclusively for you,{" "}
            <strong className="text-ink">we do not offer cash refunds to original payment methods</strong> (credit/debit cards, net banking, or UPI).
          </p>
          <p className="mt-2 text-muted">
            All approved returns and eligible order adjustments are processed as{" "}
            <strong className="text-ink">Nixie Store Credit</strong> in the form of a dedicated credit voucher code valid for future orders.
          </p>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">2. Alteration Policy & Precision Fit</h2>
          <p className="mt-3 text-muted">
            Since every Nixie outfit is handmade to order, we do not carry mass inventory for traditional size exchanges.
            Instead, we offer alterations to ensure your garment fits you comfortably.
          </p>
          
          <div className="mt-4 rounded-xl border border-line bg-mint/30 p-5">
            <h3 className="font-semibold text-ink">Alteration Request Window</h3>
            <p className="mt-1 text-[14.5px] text-muted">
              Alteration requests must be initiated within <strong className="text-ink">3 calendar days</strong> of parcel delivery.
            </p>
          </div>

          <div className="mt-5 space-y-3 text-muted">
            <p>
              <strong className="text-ink">Major Fit Adjustments:</strong> For major fit discrepancies (e.g., significantly too tight, too loose, or incorrect length according to given measurements), our studio handles the complete alteration.
            </p>
            <p>
              <strong className="text-ink">Minor Adjustments:</strong> Subtle adjustments such as slight strap length tweaking, basic hem shifts, or minor waist nip-ins are often faster and more cost-effective when done by your trusted local tailor. You may reach out to our design team anytime for guidance.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-[14.5px]">
              <thead className="border-b border-line bg-mint/80 font-semibold text-ink">
                <tr>
                  <th className="px-5 py-3">Service / Request</th>
                  <th className="px-5 py-3">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-muted">
                <tr>
                  <td className="px-5 py-3 font-medium text-ink">First Round Alteration Pickup Fee</td>
                  <td className="px-5 py-3">₹70 (flat reverse pickup charge)</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-ink">Second Round Alteration (same garment)</td>
                  <td className="px-5 py-3">₹250</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-ink">Alterations beyond two rounds</td>
                  <td className="px-5 py-3">Not accommodated</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-5 space-y-2 text-[14.5px] text-muted">
            <p className="font-medium text-ink">Alteration Workflow:</p>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Submit your request via our <Link href="/contact" className="text-teal-deep font-semibold hover:underline">Contact Form</Link> or support email with photos of the fit issue.</li>
              <li>Once verified, reverse pickup is scheduled (up to 2 pickup attempts). Alternatively, you may self-ship to our Nagpur studio.</li>
              <li>Following studio arrival and inspection, alterations take approximately 10–12 working days. You will receive email tracking once dispatched back to you.</li>
            </ol>
          </div>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">3. Apparel Return Policy</h2>
          <p className="mt-3 text-muted">
            Returns are strictly accepted only under the following conditions:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
            <li>You received an incorrect item or color significantly different from your approved order.</li>
            <li>The delivered garment has a genuine, verified manufacturing defect.</li>
          </ul>

          <div className="mt-4 rounded-xl border border-line p-5">
            <h3 className="font-semibold text-ink text-[15px]">Return Eligibility Conditions:</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-muted">
              <li>Request submitted within 3 days of delivery.</li>
              <li>Garment must be completely unused, unwashed, unaltered, with original tags intact.</li>
              <li>A flat reverse logistics fee of <strong>₹150</strong> is deducted from the issued store credit.</li>
              <li>Innerwear, customized accessories, and final clearance items are strictly non-returnable.</li>
            </ul>
          </div>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">4. Store Credit Guidelines</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-[14.5px]">
              <thead className="border-b border-line bg-mint/80 font-semibold text-ink">
                <tr>
                  <th className="px-5 py-3">Rule</th>
                  <th className="px-5 py-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-muted">
                <tr>
                  <td className="px-5 py-3 font-medium text-ink">Validity Period</td>
                  <td className="px-5 py-3">180 days from the date of issue</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-ink">Usage Limit</td>
                  <td className="px-5 py-3">Single-use coupon code</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-ink">Minimum Order Value</td>
                  <td className="px-5 py-3">Must be equal to or greater than the voucher value</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-ink">Combinability</td>
                  <td className="px-5 py-3">Cannot be clubbed with other promotional codes</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-ink">Subsequent Orders</td>
                  <td className="px-5 py-3">Orders placed utilizing store credit are final sale</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">5. Order Cancellation Guidelines</h2>
          <p className="mt-3 text-muted">
            Because fabrics are purchased or custom dyed and master patterns drafted immediately after order confirmation,{" "}
            cancellations are subject to strict stage limits:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>
              <strong className="text-ink">Fabric Sourcing Stage:</strong> If you are unsatisfied with the fabrics sourced/shown, or if our studio is unable to match the desired fabric, you may request a cancellation and receive a full refund at this stage only.
            </li>
            <li>
              <strong className="text-ink">Post-Fabric Approval:</strong> Once fabric has been approved and cutting or stitching commences, cancellations and refunds are not permitted under any circumstances.
            </li>
          </ul>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">6. Our Philosophy</h2>
          <p className="mt-3 text-muted">
            Every Nixie piece is made consciously with care, avoiding mass-market overproduction and synthetic waste.
            We are dedicated to working closely with you to ensure your bespoke piece feels wonderful to wear.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-[14px] font-medium text-teal-deep">
            <Link href="/contact" className="hover:underline">
              Submit an Inquiry
            </Link>
            <span className="text-muted/40">•</span>
            <a href="mailto:aishwarya@thenixie.in" className="hover:underline">
              aishwarya@thenixie.in
            </a>
          </div>
        </section>
      </div>
    </PolicyShell>
  );
}
