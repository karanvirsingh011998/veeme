import { Hero } from "./Hero";
import { LiveNearby } from "./LiveNearby";
import { HowItWorks } from "./HowItWorks";
import { Safety } from "./Safety";
import { FinalCta } from "./FinalCta";

/**
 * Veeme Refined landing — peach palette, plans-first mobile composition.
 */
export function LandingPage() {
  return (
    <main>
      <Hero />
      <LiveNearby />
      <HowItWorks />
      <Safety />
      <FinalCta />
    </main>
  );
}
