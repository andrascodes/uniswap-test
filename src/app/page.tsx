import Uni from "@/components/HomePage/Uni";
import "@/lib/wagmi/config";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Uni />
    </main>
  );
}
