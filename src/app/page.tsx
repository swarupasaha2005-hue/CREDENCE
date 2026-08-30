import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
      </main>
    </div>
  );
}
