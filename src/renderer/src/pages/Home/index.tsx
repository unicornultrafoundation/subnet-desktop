import Section1 from "@/pages/Home/Section-1.tsx";
// import Section2 from "@/pages/Home/Section-2.tsx";
import Section3 from "@/pages/Home/Section-3.tsx";
import Header from "@/components/Header";

function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <Section1 />
      {/* <Section2 /> */}
      <Section3 />
    </main>
  );
}

export default HomePage;
