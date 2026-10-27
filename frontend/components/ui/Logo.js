import Image from "next/image";
import blackLogo from "@/public/brand/nixie-logo-black.png";
import whiteLogo from "@/public/brand/nixie-logo-white.png";

export default function Logo({ tone = "black", className = "h-7 w-auto", priority = false }) {
  return (
    <Image src={tone === "white" ? whiteLogo : blackLogo} alt="Nixie" className={className} priority={priority} />
  );
}
