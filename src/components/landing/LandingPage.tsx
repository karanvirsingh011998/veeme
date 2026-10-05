import { SiteHeader } from "./SiteHeader";
import { Hero } from "./Hero";
import { Categories } from "./Categories";
import { PlansDifferentiator } from "./PlansDifferentiator";
import { HowItWorks } from "./HowItWorks";
import { Safety } from "./Safety";
import { Lifestyle } from "./Lifestyle";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";

/**
 * Public Vemee landing page — plans-first social discovery experience.
 */
export function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Categories />
        <PlansDifferentiator />
        <HowItWorks />
        <Safety />
        <Lifestyle />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
