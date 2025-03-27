import Image from "next/image";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function HyperaideLogo({style = "default", className}: {style?: "small" | "default", className?: string}) {

  if (style === "small") {
    return (
      <div className={`flex flex-row items-center justify-center gap-1 ${className}`}>
        <Image src="/hyperaide-black-logomark.svg" alt="Logo" width={12} height={12} />
        <h1 className={`${outfit.className} text-sm font-medium`}>Hyperaide</h1>
      </div>
    );
  }

  return (
    <div className={`flex flex-row items-center justify-center ${className}`}>
      <Image src="/hyperaide-black-logomark.svg" alt="Logo" width={32} height={32} />
      <h1 className={`${outfit.className} text-xl font-medium`}>Hyperaide</h1>
    </div>
  );
}