import { SiteHeader } from "./SiteHeader";
import { Hero } from "./Hero";
import { Categories } from "./Categories";
import { HowItWorks } from "./HowItWorks";
import { PeoplePreview } from "./PeoplePreview";
import { Safety } from "./Safety";
import { Communities } from "./Communities";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";

/**
 * Public Vemee landing page composition (mobile-first section order).
 */
export function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Categories />
        <HowItWorks />
        <PeoplePreview />
        <Safety />
        <Communities />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}