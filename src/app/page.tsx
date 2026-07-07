import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductPreviewSection } from "@/components/ProductPreviewSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { MethodologySection } from "@/components/MethodologySection";
import { TrainingPrioritiesSection } from "@/components/TrainingPrioritiesSection";
import { QueueSection } from "@/components/QueueSection";
import { SkillTraceSection } from "@/components/SkillTraceSection";
import { PricingSection } from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ProductPreviewSection />
        <HowItWorksSection />
        <MethodologySection />
        <TrainingPrioritiesSection />
        <QueueSection />
        <SkillTraceSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
