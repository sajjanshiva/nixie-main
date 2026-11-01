// Fixed website text (not editable from admin, by decision).
// Text here is a draft for the founder to review; change it any time.

export const HERO = {
  title: "Found a look you can’t stop thinking about?",
  subtitle: "Upload a photo of it. We’ll tell you what it costs to have Nixie make it for you.",
};

export const HOW_IT_WORKS = {
  title: "From a saved photo to your wardrobe",
  intro: "Simple, guided and actually enjoyable. You stay in charge of every detail.",
  steps: [
    {
      title: "Show us the look",
      text: "A screenshot, a Pinterest pin, a celebrity moment. Upload it and see what it would cost to have it made.",
    },
    {
      title: "Make it yours",
      text: "Change the colour, the neckline, the sleeves or the length. We talk it through with you before anything is cut.",
    },
    {
      title: "We make it from scratch",
      text: "Patterns, fabric, stitching and finishing, all done in-house. Then we deliver it to your door, made to your measurements.",
    },
  ],
};

export const WHAT_HAPPENS_NEXT = [
  { title: "We call you", text: "Our team reaches out on the number you shared to talk through your design." },
  {
    title: "You approve the details",
    text: "Fabric, fit and final price are agreed with you. Then we email an invoice you can pay in full, or half now and half later.",
  },
  { title: "We make and deliver it", text: "Your outfit is made from scratch in-house and delivered to your address." },
];

export const ESTIMATE_NOTE =
  "This is an estimated price. The final price may vary based on design details, measurements and customisation.";

// From thenixie.in/pages/faqs — only questions that have answers.
export const FAQS = [
  {
    q: "If I give you an outfit inspiration, how precisely can you recreate it?",
    a: "We recreate the overall look, fit and silhouette while making sure every detail suits your body, comfort and chosen fabrics. Our goal is to achieve about an 80 percent match to the inspiration while tailoring the remaining elements to what works best for you. The final outfit is a personalised version crafted exclusively for you, not an exact copy.",
  },
  {
    q: "What if I don’t like the fabrics shown for my outfit?",
    a: "You can always request more options. Our team will share additional fabrics based on your style and the look you want. If we are unable to find the right fabric for your outfit, your order can be cancelled and refunded. Note: once the fabric is approved by you and locked, the order cannot be cancelled.",
  },
  {
    q: "Can I see fabrics before placing the order?",
    a: "We do not source fabrics before an order is placed, since every piece is customised and fabric options are selected specifically for your design. Once the order is confirmed, we share videos, close-ups and drape shots of all suitable fabrics for your approval.",
  },
  {
    q: "What if I don’t like the outfit after it’s made?",
    a: "Your outfit is crafted with close attention to your inspiration, measurements and the approvals you share with us along the way. If you need minor adjustments for fit, we are happy to help. Since each piece is made specially for you, full cancellations or remakes are not possible, but we always work with you to make sure the final look feels right and comfortable.",
  },
  { q: "Where are you located?", a: "Our production is set up in Nagpur, Maharashtra. We deliver across India." },
  {
    q: "What if the delivery takes longer than expected?",
    a: "We will keep you informed and share a revised timeline. Delays are rare, but we communicate everything clearly.",
  },
  { q: "Can we pay by cash on delivery?", a: "Since every outfit is custom made, we accept prepaid payments only." },
];

// Footer quick links
export const FOOTER_LINKS = [
  { label: "About Nixie", href: "/about-nixie" },
  { label: "FAQs", href: "/#faqs" },
  { label: "Careers", href: "/careers" },
  { label: "Collaborate with Nixie", href: "/collaborate" },
  { label: "Contact", href: "/contact" },
  { label: "Shipping & Delivery", href: "/shipping" },
  { label: "Returns & Cancellations", href: "/refund-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
];

export const QUICK_LINKS = FOOTER_LINKS.map((item) => item.label);

export const TAGLINE = "Outfits you dream up, made for you.";

// Used only if /api/meta can't be reached (same list as the backend).
export const FALLBACK_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];
