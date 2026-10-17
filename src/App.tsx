import { useState, useRef } from "react";

type IconName = "home" | "pulse" | "users" | "file" | "bell" | "shield" | "pill" | "mic" | "check" | "arrow" | "plus" | "camera" | "image" | "close" | "upload" | "doc" | "trash";

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/></>,
    pulse: <path d="M2 12h4l2-7 4 14 3-9 2 2h5"/>,
    users: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-4 2-6 6-6s6 2 6 6M15 15c4 0 6 2 6 5"/></>,
    file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></>,
    bell: <><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z"/><path d="M10 21h4"/></>,
    shield: <><path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    pill: <><path d="M7 17 17 7a4 4 0 0 0-6-6L1 11a4 4 0 0 0 6 6Z"/><path d="m7 5 6 6"/></>,
    mic: <><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></>,
    check: <path d="m4 12 5 5L20 6"/>,
    arrow: <><path d="m9 18 6-6-6-6"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
    close: <path d="M18 6 6 18M6 6l12 12"/>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Button({ children, tone = "primary", onClick, className = "" }: { children: React.ReactNode; tone?: "primary" | "outline" | "danger" | "ink"; onClick?: () => void; className?: string }) {
  return <button className={`button ${tone} ${className}`} onClick={onClick}>{children}</button>;
}

function StateBar({ state, setState }: { state: string; setState: (s: string) => void }) {
  const states = ["Default", "Offline", "Syncing", "Empty", "Error", "Large text"];
  return <div className="statebar" aria-label="Preview states">{states.map(s => <button className={state === s ? "active" : ""} onClick={() => setState(s)} key={s}>{s}</button>)}</div>;
}

function StatusBanner({ state }: { state: string }) {
  if (state === "Default" || state === "Large text") return null;
  const copy: Record<string, string> = { Offline: "Saved on this device, will sync", Syncing: "Syncing securely…", Empty: "Nothing here yet", Error: "We couldn’t refresh. Your saved data is safe." };
  return <div className={`status-banner ${state.toLowerCase()}`}><span>{state === "Syncing" ? "↻" : state === "Error" ? "!" : "✓"}</span>{copy[state]}</div>;
}

function PatientHome({ onSos, navigate }: { onSos: () => void; navigate: (s: string) => void }) {
  return <div className="phone dark">
    <header className="mobile-head"><div className="avatar">E</div><div><span>Good evening</span><h1>Your care, your control</h1></div><button className="icon-button" aria-label="Notifications"><Icon name="bell"/></button></header>
    <main className="mobile-content">
      <section className="card protection"><div className="status-ring"><Icon name="shield" size={34}/></div><div><div className="eyebrow jade">Protected</div><h2>Your Circle is active</h2><p>Trusted contacts are ready when you need them.</p></div></section>
      <button className="sos-button" onClick={onSos}><div><strong>Hold to send SOS</strong><span>Alerts your Circle with live location</span></div><span className="sos-icon">!</span></button>
      <section className="card medication"><div className="icon-tile"><Icon name="pill"/></div><div className="grow"><span>Next medication · 20:00</span><h2>Levetiracetam 500 mg</h2></div><Button onClick={() => undefined}>Taken</Button></section>
      <div className="tile-grid">
        {[["pulse","Conditions","Types and triggers"],["users","Care Circle","You decide who sees what"],["shield","My Doctor","Verified clinician link"],["file","Records","Events, notes, reports"]].map(([icon,title,sub]) => <button className="feature-tile" key={title} onClick={() => (title === "Care Circle" && navigate("circle")) || (title === "Records" && navigate("records"))}><Icon name={icon as IconName}/><strong>{title}</strong><span>{sub}</span></button>)}
      </div>
    </main>
    <nav className="bottom-nav">{[["home","Home"],["pulse","Insights"],["users","Circle"],["file","Records"]].map(([icon,label]) => <button className={label === "Home" ? "selected" : ""} onClick={() => { if (label === "Insights") navigate("insights"); else if (label === "Circle") navigate("circle"); else if (label === "Records") navigate("records"); else navigate("home"); }} key={label}><Icon name={icon as IconName}/><span>{label}</span></button>)}</nav>
  </div>;
}

function SosScreen({ back }: { back: (sent?: boolean) => void }) {
  const [sent, setSent] = useState(false);
  if (sent) return <div className="phone dark center-screen"><div className="sent-check"><Icon name="check" size={42}/></div><div className="eyebrow coral">SOS sent</div><h1>Your Circle has been alerted</h1><p>Live location is being shared with 3 emergency contacts.</p><Button tone="outline" onClick={() => back(true)}>Return home</Button></div>;
  return <div className="phone dark sos-screen"><div className="eyebrow coral"><span className="dot coral-bg"/> SOS</div><div className="countdown"><strong>5</strong><span>seconds</span></div><h1>Sending your SOS</h1><p>Your emergency contacts will be alerted with your live location.</p><section className="card compact-list"><div><span><strong>Push alert</strong><small>Used when you are online</small></span><em>Ready</em></div><div><span><strong>SMS fallback</strong><small>Used when you have no internet</small></span><em>Ready</em></div><div><span><strong>Emergency contacts</strong><small>First to respond is shown to everyone</small></span><b>3</b></div></section><div className="sos-actions"><Button tone="danger" onClick={() => setSent(true)}>Send now</Button><Button tone="outline" onClick={() => back()}>Cancel, I am okay</Button></div></div>;
}

function CircleScreen({ back }: { back: () => void }) {
  const [toggles, setToggles] = useState([true,true,true,true,false]);
  const [toast, setToast] = useState(false);
  const labels = [["Emergency alerts","Receive your SOS with location"],["Medication schedule","Doses and reminders"],["Appointments","Dates and clinic details"],["Event summaries","What happened, without notes"],["Records","Reports and documents"]];
  const toggle = (i:number) => { const next=[...toggles]; next[i]=!next[i]; setToggles(next); setToast(true); setTimeout(()=>setToast(false),1800); };
  return <div className="phone dark scroll-phone"><header className="subhead"><button className="icon-button" onClick={back}>‹</button><h1>Care Circle</h1></header><main className="mobile-content"><p className="intro">You decide who sees what. You can remove access at any time.</p><section className="card person-card"><div className="person"><div className="avatar">A</div><div><h2>Contact A</h2><p>Caregiver · emergency contact</p></div><span className="chip">{toggles.filter(Boolean).length} of 5</span></div>{labels.map(([a,b],i)=><div className="permission" key={a}><span><strong>{a}</strong><small>{b}</small></span><button role="switch" aria-checked={toggles[i]} className={`toggle ${toggles[i] ? "on":""}`} onClick={()=>toggle(i)}><i/></button></div>)}</section><section className="card person collapsed"><div className="avatar">B</div><div><h2>Contact B</h2><p>Family · emergency contact</p></div><span className="chip muted-chip">1 of 5</span></section><Button tone="outline" className="full">See who viewed what</Button><Button className="full">Invite someone</Button></main>{toast && <div className="toast"><Icon name="check"/> Sharing preference updated</div>}</div>;
}

function Insights({ back }: { back: () => void }) {
  const [logging,setLogging]=useState(false);
  const [text,setText]=useState("Felt light-headed for a few minutes after dinner.");
  return <div className="phone dark scroll-phone"><header className="subhead"><button className="icon-button" onClick={back}>‹</button><h1>Insights</h1><span className="chip muted-chip">Sample</span></header><main className="mobile-content"><section className="card insight"><div className="eyebrow jade">This week</div><h2>You logged 2 events. Both came after a late or missed evening dose.</h2><p>Built from <u>2 event logs</u> and <u>7 medication check-ins</u>. This is a pattern, not a diagnosis.</p></section><section className="card voice"><div><h2>Log by voice</h2><span className="jade">Works offline</span></div>{logging ? <div className="saved-log"><label>Editable saved log<textarea value={text} onChange={e=>setText(e.target.value)}/></label><Button onClick={()=>setLogging(false)}>Save log</Button></div> : <><button className="mic" onClick={()=>setLogging(true)}><Icon name="mic" size={30}/></button><p>Say what happened and Epi turns it into a log you can edit.</p></>}</section><section className="card brief"><div className="icon-tile"><Icon name="file"/></div><div><h2>Visit brief is ready</h2><p>Review it, then share with your clinician</p></div><Button>Review</Button></section><p className="ai-rule">Epi never diagnoses or changes your medication. Summaries are drafts built from source records.</p></main></div>;
}

function Caregiver() {
  return <div className="phone light caregiver"><header className="care-head"><div><span>Caregiver</span><h1>Looking after Patient A</h1></div><span className="share-chip"><Icon name="shield"/> Shared with you</span></header><main className="mobile-content"><section className="alert-card"><div className="eyebrow coral"><span className="dot coral-bg"/> Emergency alert</div><h2>No active alerts</h2><p>You will be notified instantly, with live location, if an SOS is sent to your Circle.</p></section><section className="card"><h2>What you can see</h2><div className="chips"><span>Medication schedule</span><span>Appointments</span><span>Event summaries</span><span className="off">Records · not shared</span></div><p>You only see information the patient or guardian has authorized. Access can be changed at any time.</p></section><section className="card today"><div><h2>Today</h2><span>Reminders</span></div><article><div className="icon-tile"><Icon name="pill"/></div><span><strong>Evening medication</strong><small>20:00 · reminder to confirm</small></span></article><article><div className="icon-tile"><Icon name="file"/></div><span><strong>Clinic follow-up</strong><small>Upcoming · help with transport</small></span></article></section></main><div className="sticky-action"><Button tone="ink"><Icon name="plus"/> Record an observation</Button></div></div>;
}

function Clinician() {
  const [brief,setBrief]=useState(false); const [approved,setApproved]=useState(false);
  if(brief) return <div className="clinician-shell"><Sidebar/><main className="dashboard brief-page"><button className="back-link" onClick={()=>setBrief(false)}>‹ Back to roster</button><div className="dash-head"><div><span>Pre-visit brief</span><h1>Patient A</h1></div><div className="head-actions"><span className="draft-badge">AI draft · review before use</span><Button tone="outline">Edit</Button><Button tone="ink" onClick={()=>setApproved(true)}>{approved ? "Approved and added" : "Approve and add to record"}</Button></div></div><div className="brief-grid"><div><section className="card"><h2>What changed since the last visit</h2><ul className="source-list"><li>Two events were logged, both after a late or missed evening dose. <u>Sources 1, 2</u></li><li>One caregiver observation was added the same morning. <u>Source 3</u></li><li>Medication check-ins were on time on most days. <u>Source 4</u></li></ul></section><div className="two-cards"><section className="card"><h2>Missed doses</h2><p>Listed with the real time each check-in was tapped on the patient’s device.</p></section><section className="card"><h2>Open follow-ups</h2><p>Tasks from the last visit and whether each was completed.</p></section></div><div className="audit-note">Epi summarizes what was logged. It does not diagnose or recommend treatment. Nothing is saved until you approve it.</div></div><section className="card sources"><h2>Sources</h2>{["Event logged by patient","Event logged by patient","Observation by caregiver","Medication check-ins"].map((s,i)=><div key={i}><b>{i+1}</b><span><strong>{s}</strong><small>{i<2?"Today · 07:40":i===2?"Today · 08:05":"This period"}</small></span></div>)}</section></div></main></div>;
  return <div className="clinician-shell"><Sidebar/><main className="dashboard"><div className="dash-head"><div><span>Clinician dashboard</span><h1>Today across your patients</h1></div><div><Button tone="outline">Request access</Button><Button tone="ink">New follow-up</Button></div></div><section className="card roster"><h2>Patient management</h2><div className="table"><div className="tr th"><span>Patient</span><span>Last event</span><span>Medication</span><span>Status</span></div>{[["Patient A","Today, 07:40","On schedule","Review"],["Patient B","3 days ago","Missed 1 dose","Follow up"],["Patient C","Last month","On schedule","Stable"]].map((r,i)=><button className="tr" onClick={()=>i===0&&setBrief(true)} key={r[0]}>{r.map((x,j)=><span key={x} className={j===3?`status s${i}`:""}>{x}</span>)}</button>)}</div></section><div className="dash-grid"><section className="card chart-card"><div><h2>Health trends · Patient A</h2><span>Last 90 days</span></div><svg viewBox="0 0 600 180" preserveAspectRatio="none"><path d="M0 55 60 66 120 50 180 90 240 102 300 97 360 125 420 120 480 145 540 105 600 155" fill="none" stroke="#0E7C6B" strokeWidth="3"/><path d="M0 40H600M0 90H600M0 140H600" stroke="#DCE6E4"/></svg><p>Sample trend. Select a point to open its linked event.</p></section><section className="card events"><h2>Events review</h2><p><i className="event-dot red"/> <strong>Event logged by patient</strong><small>Today · 07:40</small></p><p><i className="event-dot green"/> <strong>Observation added by caregiver</strong><small>Today · 08:05</small></p><p><i className="event-dot gray"/> <strong>Awaiting your review</strong><small>Add notes or schedule a follow-up</small></p></section></div><section className="follow-banner"><div><h2>Follow-up management</h2><p>Two patients are due for a check-in this week.</p></div><Button>Open queue</Button></section></main></div>;
}

function Sidebar(){return <aside className="sidebar"><div className="brand"><span>E</span><strong>Epi</strong> Clinic</div><nav>{["Patient management","Health trends","Events review","Follow-up management"].map((x,i)=><button className={i===0?"active":""} key={x}>{x}</button>)}</nav><div className="verified"><div><Icon name="shield"/> Verified clinician</div><p>Every record view is consent-checked and written to an audit trail.</p></div></aside>}

function ImageUpload({ onAdd, max = 4 }: { onAdd?: (url: string) => void; max?: number }) {
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).slice(0, max - previews.length).forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviews(p => [...p, url]);
      onAdd?.(url);
    });
  };

  const remove = (i: number) => setPreviews(p => p.filter((_, idx) => idx !== i));

  return (
    <div className="img-upload-root">
      {previews.length > 0 && (
        <div className="img-preview-grid">
          {previews.map((src, i) => (
            <div className="img-thumb" key={src}>
              <img src={src} alt={`Attachment ${i + 1}`} />
              <button className="img-remove" onClick={() => remove(i)} aria-label="Remove"><Icon name="close" size={14}/></button>
            </div>
          ))}
          {previews.length < max && (
            <button className="img-add-more" onClick={() => inputRef.current?.click()}>
              <Icon name="plus" size={20}/>
            </button>
          )}
        </div>
      )}
      {previews.length === 0 && (
        <button className="img-dropzone" onClick={() => inputRef.current?.click()}>
          <div className="img-drop-icon"><Icon name="camera" size={28}/></div>
          <strong>Add photo or document</strong>
          <span>Tap to browse your device</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*,application/pdf" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
    </div>
  );
}

type RecordItem = { id: number; title: string; date: string; type: "photo" | "doc" | "report"; thumb?: string };

function RecordsScreen({ back }: { back: () => void }) {
  const [tab, setTab] = useState<"all" | "photos" | "docs">("all");
  const [showUpload, setShowUpload] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>([
    { id: 1, title: "Hospital discharge summary", date: "Oct 10, 2026", type: "doc" },
    { id: 2, title: "MRI scan — Oct 2026", date: "Oct 8, 2026", type: "report" },
    { id: 3, title: "Medication label photo", date: "Oct 5, 2026", type: "photo" },
    { id: 4, title: "Seizure observation", date: "Sep 29, 2026", type: "photo" },
  ]);

  const filtered = tab === "all" ? records : tab === "photos" ? records.filter(r => r.type === "photo") : records.filter(r => r.type !== "photo");

  const addRecord = (url: string) => {
    setRecords(prev => [{ id: Date.now(), title: "New attachment", date: "Oct 17, 2026", type: "photo", thumb: url }, ...prev]);
    setShowUpload(false);
  };

  const remove = (id: number) => setRecords(prev => prev.filter(r => r.id !== id));

  return (
    <div className="phone dark scroll-phone">
      <header className="subhead">
        <button className="icon-button" onClick={back}>‹</button>
        <h1>Records</h1>
        <button className="icon-button" onClick={() => setShowUpload(v => !v)} aria-label="Add"><Icon name="plus"/></button>
      </header>

      {showUpload && (
        <div className="records-upload-panel">
          <p className="upload-label">Attach a photo or document</p>
          <ImageUpload onAdd={addRecord} />
        </div>
      )}

      <div className="records-tabs">
        {(["all","photos","docs"] as const).map(t => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t === "all" ? "All" : t === "photos" ? "Photos" : "Documents"}
          </button>
        ))}
      </div>

      <main className="mobile-content" style={{ paddingTop: 8 }}>
        {filtered.length === 0 && (
          <div className="records-empty">
            <Icon name="image" size={38}/>
            <p>No {tab} yet. Tap + to add one.</p>
          </div>
        )}
        {filtered.map(r => (
          <div className="record-row" key={r.id}>
            <div className="record-thumb">
              {r.thumb ? <img src={r.thumb} alt="" /> : r.type === "photo" ? <Icon name="image" size={22}/> : <Icon name="doc" size={22}/>}
            </div>
            <div className="record-meta">
              <strong>{r.title}</strong>
              <span>{r.date} · {r.type}</span>
            </div>
            <button className="icon-button record-del" onClick={() => remove(r.id)} aria-label="Delete"><Icon name="trash" size={16}/></button>
          </div>
        ))}

        <button className="records-add-btn" onClick={() => setShowUpload(true)}>
          <Icon name="upload" size={18}/> Upload new file
        </button>
      </main>
    </div>
  );
}

export default function App() {
  const [role,setRole]=useState<"patient"|"caregiver"|"clinician">("patient");
  const [screen,setScreen]=useState("home");
  const [state,setState]=useState("Default");
  return <div className={`app ${state === "Large text" ? "large-text":""}`}>
    <div className="preview-tools"><div className="role-switch">{["patient","caregiver","clinician"].map(r=><button key={r} className={role===r?"active":""} onClick={()=>{setRole(r as typeof role);setScreen("home")}}>{r}</button>)}</div><StateBar state={state} setState={setState}/></div>
    <StatusBanner state={state}/>
    <div className="stage">{role==="patient" ? screen==="sos"?<SosScreen back={()=>setScreen("home")}/>:screen==="circle"?<CircleScreen back={()=>setScreen("home")}/>:screen==="insights"?<Insights back={()=>setScreen("home")}/>:screen==="records"?<RecordsScreen back={()=>setScreen("home")}/>:<PatientHome onSos={()=>setScreen("sos")} navigate={setScreen}/>:role==="caregiver"?<Caregiver/>:<Clinician/>}</div>
  </div>;
}
