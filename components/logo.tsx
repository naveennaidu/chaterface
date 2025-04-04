import Image from "next/image";
import Link from "next/link";

export default function Logo({style = "default", className, color = "black"}: {style?: "small" | "default", className?: string, color?: "black" | "white"}) {

  if (style === "small") {
    return (
      <Link href="/" className={`flex flex-row items-center justify-center ${className}`}>
        <h1 className={`text-sm font-medium text-sage-12`}>IchiGPT</h1>
      </Link>
    );
  }

  return (
    <Link href="/" className={`flex flex-row items-center justify-center ${className}`}>
      <h1 className={`text-xl font-medium text-sage-12`}>IchiGPT</h1>
    </Link>
  );
}