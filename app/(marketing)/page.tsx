import { Navbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { About } from "@/components/marketing/about";
import { Works } from "@/components/marketing/works";
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
        <Works />
        <TechMarquee />
        <Footer />
      </main>
    </SmoothScroll>
  );
}
