"use client";
// "Continue with Google" using Google Identity Services. The backend verifies the token.
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useMeta } from "@/components/providers/MetaProvider";

export default function GoogleButton({ onCredential, text = "continue_with" }) {
  const { meta, ready } = useMeta();
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(typeof window !== "undefined" && !!window.google?.accounts?.id);
  const cbRef = useRef(onCredential);
  cbRef.current = onCredential;

  useEffect(() => {
    if (!loaded || !meta.googleClientId || !ref.current) return;
    const g = window.google.accounts.id;
    g.initialize({
      client_id: meta.googleClientId,
      callback: (res) => res?.credential && cbRef.current(res.credential),
      ux_mode: "popup",
      context: "signin",
    });
    const width = Math.min(400, ref.current.parentElement?.clientWidth || 360);
    g.renderButton(ref.current, { theme: "outline", size: "large", shape: "pill", text, width, logo_alignment: "center" });
  }, [loaded, meta.googleClientId, text]);

  if (ready && !meta.googleClientId) return null; // Google login not configured yet

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setLoaded(true)} onReady={() => setLoaded(true)} />
      <div className="flex min-h-[44px] w-full justify-center">
        <div ref={ref} />
      </div>
    </>
  );
}
