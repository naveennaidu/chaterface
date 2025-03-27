import Image from "next/image";

export default function Logo({style = "default", className, color = "black"}: {style?: "small" | "default", className?: string, color?: "black" | "white"}) {

  if (style === "small") {
    return (
      <div className={`flex flex-row items-center justify-center ${className}`}>
        <Image src={color === "black" ? "/black-logomark.svg" : "/white-logomark.svg"} alt="Logo" width={24} height={24} />
        <h1 className={`text-sm font-medium ${color === "black" ? "text-sage-12" : "text-sage-2"}`}>Chaterface</h1>
      </div>
    );
  }

  return (
    <div className={`flex flex-row items-center justify-center ${className}`}>
      <Image src={color === "black" ? "/black-logomark.svg" : "/white-logomark.svg"} alt="Logo" width={32} height={32} />
      <h1 className={`text-xl font-medium ${color === "black" ? "text-sage-12" : "text-sage-2"}`}>Chaterface</h1>
    </div>
  );
}