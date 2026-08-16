import { Navbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { About } from "@/components/marketing/about";
import { Checks } from "@/components/marketing/checks";
import { Research } from "@/components/marketing/research";
import { TechMarquee } from "@/components/marketing/tech-marquee";
import { Footer } from "@/components/marketing/footer";
import { CustomCursor } from "@/components/marketing/custom-cursor";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { SectionBlend } from "@/components/marketing/section-blend";

export default function LandingPage() {
  return (
    <SmoothScroll>
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <SectionBlend />
        <About />
        <Checks />
        <Research />
        <TechMarquee />
        <Footer />
      </main>
    </SmoothScroll>
  );
}
