import PolicyShell from "@/components/site/PolicyShell";

export const metadata = {
  title: "Shipping & Delivery Policy",
  description:
    "Information about production timelines, domestic shipping across India, delivery estimates, and order tracking for Nixie custom outfits.",
};

export default function ShippingPage() {
  return (
    <PolicyShell
      title="Shipping & Delivery Policy"
      subtitle="Every Nixie piece is made on order in our Nagpur studio and delivered across India with end-to-end tracking."
      lastUpdated="October 2026"
    >
      <div className="space-y-10">
        <section>
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">1. Processing & Production Time</h2>
          <p className="mt-3 text-muted">
            All custom orders are made to measure and crafted from scratch with care. Please allow{" "}
            <strong className="text-ink">5–10 business days</strong> for production, pattern drafting, stitching, and
            quality inspection before your outfit is dispatched.
          </p>
          <p className="mt-2 text-muted">
            You will receive a confirmation email containing your tracking number and courier partner details as soon as
            your package is dispatched.
          </p>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">2. Domestic Delivery & Timelines</h2>
          <p className="mt-3 text-muted">
            We partner with reliable express courier services to deliver across India.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-line bg-mint/40">
            <table className="w-full text-left text-[14.5px]">
              <thead className="border-b border-line bg-mint/80 font-semibold text-ink">
                <tr>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3">Estimated Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-muted">
                <tr>
                  <td className="px-5 py-3 font-medium text-ink">Custom Production</td>
                  <td className="px-5 py-3">5–10 business days</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-ink">Transit Time (Post-dispatch)</td>
                  <td className="px-5 py-3">2–3 business days</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-ink">Total Estimated Doorstep Delivery</td>
                  <td className="px-5 py-3">7–14 business days from order confirmation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">3. Shipping Rates</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            <li>
              <strong className="text-ink">Free Standard Shipping:</strong> Applicable on all prepaid orders above{" "}
              <strong className="text-ink">₹999</strong> across India.
            </li>
            <li>
              For orders below ₹999, shipping charges are calculated at checkout based on package weight and destination pin code.
            </li>
          </ul>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">4. Order Tracking</h2>
          <p className="mt-3 text-muted">
            Once dispatched, you will receive a tracking link via email. You can also view active order and invoice statuses
            directly inside your Nixie customer account dashboard.
          </p>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="text-[20px] font-semibold text-ink sm:text-[22px]">5. Delays & Transit Inquiries</h2>
          <p className="mt-3 text-muted">
            While we strive to ensure every outfit arrives strictly within the estimated timeframe, external courier
            delays or weather anomalies can occasionally occur. We monitor shipments proactively and will keep you informed
            with revised timelines.
          </p>
          <div className="mt-6 rounded-xl border border-line bg-mint/30 p-5">
            <h3 className="font-semibold text-ink">Need assistance with your shipment?</h3>
            <p className="mt-1 text-[14px] text-muted">
              Reach out directly to our team:
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-[14px] font-medium text-teal-deep">
              <a href="mailto:aishwarya@thenixie.in" className="hover:underline">
                aishwarya@thenixie.in
              </a>
              <span className="text-muted/40">•</span>
              <a href="tel:+918855014059" className="hover:underline">
                +91 8855014059
              </a>
            </div>
          </div>
        </section>
      </div>
    </PolicyShell>
  );
}
