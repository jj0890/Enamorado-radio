import Navigation from "@/components/Navigation";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import ContributorGrid from "@/components/ContributorGrid";

export default function ContributorsPage() {
  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <StickyRadioPlayer />
      <Navigation />
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Contributors</h1>
          <p className="text-sm text-gray-400">The writers, DJs, photographers and editors behind Enamorado Radio.</p>
        </div>
        <ContributorGrid />
      </main>
    </div>
  );
}
