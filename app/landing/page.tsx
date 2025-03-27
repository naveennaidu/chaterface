import Logo from "@/components/logo";
import { Lora } from "next/font/google";
import Button from "@/components/button";
import HyperaideLogo from "@/components/misc/hyperaide-logo";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

import { Horse, Heart, Cube, GithubLogo, ArrowRight, ChatTeardropDots } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col h-screen divide-y divide-sage-4 w-full">
      <div className="w-full relative">
        <div
          className="flex flex-col w-full relative overflow-hidden"
          style={{
            backgroundImage: "url('/hero-noise.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="w-full">
            <div className="flex flex-row items-center w-full max-w-7xl mx-auto p-4 justify-between">
              <div className="flex flex-row items-center gap-4">
                <Logo color="white"/>
                {/* <Link href="https://hyperaide.com" target="_blank" className="flex flex-col pl-4 border-l border-sage-4 group">
                  <p className="text-[10px] text-sage-11">Made By</p>
                  <HyperaideLogo className="opacity-80 group-hover:opacity-100 transition-all duration-300" style="small" />
                </Link> */}
              </div>

              {/* <div className="flex flex-row items-center gap-2">
                <Button href="/" size="small" className="bg-sage-2 border border-sage-4 text-sage-12 hover:shadow-none hover:bg-sage-3 duration-300" icon={<GithubLogo size={16} weight="bold" />}>View on GitHub</Button>
                <Button href="/" size="small" className="bg-sage-2 border border-sage-4 text-sage-12 hover:shadow-none hover:bg-sage-3 duration-300" icon={<ChatTeardropDots size={16} weight="bold" />}>Try it out</Button>
              </div> */}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto pt-40 pb-80 px-4">
            <h1 className={`${lora.className} text-5xl font-semibold text-sage-1 relative z-10`}>Your Interface to Intelligence</h1>
            <p className={`text-md text-sage-5 relative z-10`}>Chaterface is an open source chat interface for large language models.</p>

            <div className="flex flex-row items-center gap-2 mx-auto w-max mt-4">
              <Button href="/" className="bg-sage-12/50 text-sage-2 hover:shadow-none hover:bg-sage-12 duration-300" icon={<GithubLogo size={16} weight="bold" />}>View on GitHub</Button>
              <Button href="/" className="bg-sage-12 text-sage-2 hover:shadow-none hover:bg-sage-12/85 duration-300" icon={<ChatTeardropDots size={16} weight="bold" />}>Try it out</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full border-b border-sage-4">
        <div className="grid grid-cols-3 gap-4 border-x border-sage-4 max-w-7xl mx-auto divide-x divide-sage-4">
          <div className="flex flex-col w-full py-20 px-10">
            <h3 className={`text-xl font-semibold text-sage-12 relative z-10`}>Your Interface to Intelligence</h3>
            <p className={`text-md text-sage-10 relative z-10`}>Chaterface is an open source chat interface for large language models.</p>
          </div>

          <div className="flex flex-col w-full py-20 px-10">
            <h3 className={`text-xl font-semibold text-sage-12 relative z-10`}>Your Interface to Intelligence</h3>
            <p className={`text-md text-sage-10 relative z-10`}>Chaterface is an open source chat interface for large language models.</p>
          </div>

          <div className="flex flex-col w-full py-20 px-10">
            <h3 className={`text-xl font-semibold text-sage-12 relative z-10`}>Your Interface to Intelligence</h3>
            <p className={`text-md text-sage-10 relative z-10`}>Chaterface is an open source chat interface for large language models.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
