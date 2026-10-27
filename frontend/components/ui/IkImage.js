"use client";
// next/image for photos stored on ImageKit (ImageKit resizes them).
// A client component, because a loader function can't be passed from server components.
import Image from "next/image";
import imagekitLoader from "@/lib/imagekitLoader";

export default function IkImage(props) {
  return <Image loader={imagekitLoader} {...props} />;
}
