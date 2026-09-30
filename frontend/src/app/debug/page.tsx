import DebugContracts from "@/components/debug/DebugContracts";

export default function DebugPage() {
  return (
    <main className="page-wrap">
      <section className="hero hero-compact">
        <p className="section-kicker">Generated hooks</p>
        <h1>Contract console</h1>
      </section>
      <DebugContracts />
    </main>
  );
}
