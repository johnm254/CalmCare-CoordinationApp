export default function OnboardingScreen({ back, onComplete }: { back?: () => void; onComplete?: () => void }) {
  const finish = onComplete ?? back;
  return (
    <div className="phone dark" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
      <h1 style={{ color: "#EAF4F1", fontSize: 24, fontWeight: 800, margin: 0 }}>Welcome to Mojo</h1>
      <p style={{ color: "#9DB6B4", textAlign: "center", margin: 0 }}>Complete your setup to get started.</p>
      {finish && <button className="button outline" onClick={finish}>Continue</button>}
    </div>
  );
}
