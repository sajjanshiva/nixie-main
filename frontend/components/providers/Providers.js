"use client";
import { MotionConfig } from "motion/react";
import { AuthProvider } from "./AuthProvider";
import { MetaProvider } from "./MetaProvider";
import { ToastProvider } from "./ToastProvider";

export default function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <MetaProvider>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </MetaProvider>
    </MotionConfig>
  );
}
