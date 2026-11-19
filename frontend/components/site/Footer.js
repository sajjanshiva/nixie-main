"use client";
import Link from "next/link";
import { Mail } from "lucide-react";
import Logo from "@/components/ui/Logo";
import InstagramIcon from "@/components/ui/InstagramIcon";

const QUICK_LINKS = [
  { href: "/about-nixie", label: "About Nixie" },
  { href: "/careers", label: "Work with us (Careers)" },
  { href: "/collaborate", label: "Collaborate with Nixie" },
  { href: "/#faqs", label: "FAQs" },
  { href: "/shipping", label: "Shipping & Delivery" },
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/refund-policy", label: "Returns & Cancellations" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/contact", label: "Contact Us" },
];

export default function Footer() {
  return (
    <footer className="relative bg-mint text-ink border-t border-line/60">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 pt-10 pb-6 sm:px-8 sm:pt-12 lg:grid-cols-12">
        
        {/* Brand Column */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <Link href="/" aria-label="Nixie home" className="self-start">
            <Logo className="h-7 w-auto" />
          </Link>
          <p className="max-w-md text-[15.5px] leading-relaxed text-muted">
            Bespoke tailoring crafted from your favorite references. We recreate high-fashion looks to your personal size, comfort, and fabric choices with master tailors in our studio.
          </p>
          
          {/* Social Links */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://instagram.com/thenixie.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13.5px] font-semibold text-ink ring-1 ring-line hover:bg-cyan-soft hover:text-teal-deeper transition-all duration-200"
            >
              <InstagramIcon className="size-4" />
              Instagram
            </a>
            <a
              href="https://in.pinterest.com/nixieofficial/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13.5px] font-semibold text-ink ring-1 ring-line hover:bg-cyan-soft hover:text-teal-deeper transition-all duration-200"
            >
              Pinterest
            </a>
            <a
              href="https://www.linkedin.com/company/nixieofficial/home/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13.5px] font-semibold text-ink ring-1 ring-line hover:bg-cyan-soft hover:text-teal-deeper transition-all duration-200"
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="lg:col-span-4">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal-deep">Quick links</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
            {QUICK_LINKS.map((item) => (
              <li key={item.label} className="text-[14.5px]">
                <Link
                  href={item.href}
                  className="text-ink/80 transition-colors duration-150 hover:text-teal-deep hover:font-medium"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Column */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal-deep">Contact</h2>
          <a
            href="mailto:aishwarya@thenixie.in"
            className="inline-flex items-center gap-2 text-[15px] font-medium text-ink hover:text-teal-deep transition-colors"
          >
            <Mail className="size-4 text-teal-deep" aria-hidden="true" />
            aishwarya@thenixie.in
          </a>
          <Link
            href="/contact"
            className="text-[14px] text-muted hover:text-ink transition-colors underline underline-offset-4"
          >
            Send us a message & custom inquiry
          </Link>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="border-t border-line/70" aria-hidden="true" />
        <div className="flex flex-col gap-1.5 py-4 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Nixie. All rights reserved.</p>
          <p className="font-semibold text-ink">
            Made to order in Bangalore, delivered across India.
          </p>
        </div>
      </div>
    </footer>
  );
}
