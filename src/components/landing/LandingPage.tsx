import { SiteHeader } from "./SiteHeader";
import { Hero } from "./Hero";
import { LiveNearby } from "./LiveNearby";
import { HowItWorks } from "./HowItWorks";
import { Safety } from "./Safety";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";

/**
 * Veeme Refined landing — peach palette, plans-first mobile composition.
 */
export function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <LiveNearby />
        <HowItWorks />
        <Safety />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
