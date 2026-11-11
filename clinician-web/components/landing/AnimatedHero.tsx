'use client';

import Link from 'next/link';

function PhoneMockup() {
  return (
    <div
      style={{
        width: 264,
        height: 528,
        background: '#0a1a1b',
        borderRadius: 40,
        border: '8px solid #1a3335',
        boxShadow:
          '0 50px 100px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.07)',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Dynamic island */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 88,
          height: 26,
          background: '#0a1a1b',
          borderRadius: 13,
          zIndex: 10,
        }}
      />

      {/* Screen */}
      <div style={{ background: '#F5EFE3', height: '100%', paddingTop: 48 }}>
        {/* Status bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 18px 6px',
            fontSize: 10,
            color: '#6B8588',
          }}
        >
          <span style={{ fontWeight: 600 }}>9:41</span>
          <span>◉◉ 100%</span>
        </div>

        {/* App header */}
        <div
          style={{
            padding: '6px 16px 10px',
            borderBottom: '1px solid #E8E0D4',
          }}
        >
          <div style={{ fontSize: 10, color: '#6B8588' }}>Good morning,</div>
          <div
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 19,
              fontWeight: 700,
              color: '#0C1F20',
            }}
          >
            Sarah
          </div>
        </div>

        {/* BPM card */}
        <div
          style={{
            margin: '10px 12px 0',
            background: '#12383A',
            borderRadius: 18,
            padding: '12px 14px',
            color: 'white',
          }}
        >
          <div style={{ fontSize: 10, color: '#CFE0D8', marginBottom: 2 }}>
            Heart rate
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <div
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              72
            </div>
            <div style={{ fontSize: 11, color: '#CFE0D8', paddingTop: 10 }}>
              bpm
            </div>
            <div style={{ marginLeft: 'auto', position: 'relative', width: 32, height: 32 }}>
              <div
                className="animate-ring-pulse"
                style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  border: '2px solid #E8603C',
                }}
              />
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#E8603C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                  <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Mini ECG in card */}
          <svg viewBox="0 0 200 28" width="100%" height="28" style={{ marginTop: 6 }}>
            <path
              d="M0,14 L25,14 L32,14 L37,7 L40,21 L43,2 L46,26 L49,14 L56,14 L62,10 L65,14 L80,14 L100,14 L107,14 L112,7 L115,21 L118,2 L121,26 L124,14 L131,14 L137,10 L140,14 L160,14 L167,14 L172,7 L175,21 L178,2 L181,26 L184,14 L191,14 L197,10 L200,14"
              stroke="#1F7A72"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="2000"
              className="animate-ecg-draw"
              style={{ animationDelay: '0.5s' }}
            />
          </svg>
        </div>

        {/* Stats row */}
        <div style={{ margin: '8px 12px 0', display: 'flex', gap: 7 }}>
          <div
            style={{
              flex: 1,
              background: 'white',
              border: '1px solid #E8E0D4',
              borderRadius: 14,
              padding: '8px 10px',
            }}
          >
            <div style={{ fontSize: 9, color: '#6B8588' }}>Seizure-free</div>
            <div
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 22,
                fontWeight: 700,
                color: '#1F7A72',
              }}
            >
              14
            </div>
            <div style={{ fontSize: 9, color: '#6B8588' }}>days</div>
          </div>
          <div
            style={{
              flex: 1,
              background: 'white',
              border: '1px solid #E8E0D4',
              borderRadius: 14,
              padding: '8px 10px',
            }}
          >
            <div style={{ fontSize: 9, color: '#6B8588' }}>Meds today</div>
            <div
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 22,
                fontWeight: 700,
                color: '#0C1F20',
              }}
            >
              2/2
            </div>
            <div style={{ fontSize: 9, color: '#1F7A72' }}>✓ taken</div>
          </div>
        </div>

        {/* SOS Button */}
        <div
          style={{
            margin: '14px 12px 0',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div style={{ position: 'relative', width: 72, height: 72 }}>
            <div
              className="animate-ring-pulse"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(200,16,46,0.18)',
              }}
            />
            <div
              style={{
                position: 'relative',
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#C8102E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: '0 6px 20px rgba(200,16,46,0.5)',
              }}
            >
              SOS
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            borderTop: '1px solid #E8E0D4',
            display: 'flex',
            padding: '8px 0 14px',
          }}
        >
          {['🏠', '📋', '💊', '👥', '👤'].map((icon, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 18,
                opacity: i === 0 ? 1 : 0.35,
              }}
            >
              {icon}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnimatedHero() {
  return (
    <section className="relative bg-[#12383A] overflow-hidden py-20 lg:py-28 px-6">
      {/* Ambient blobs */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(31,122,114,0.25) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(232,96,60,0.12) 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
        {/* Left: text */}
        <div>
          <div
            className="inline-flex items-center gap-2 bg-white/10 text-[#CFE0D8] text-sm font-medium px-4 py-1.5 rounded-full mb-8 animate-fade-up"
            style={{ animationDelay: '0ms' }}
          >
            <span className="w-2 h-2 rounded-full bg-[#E8603C] inline-block animate-bpm-pulse" />
            Epilepsy care, coordinated
          </div>

          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              animationDelay: '100ms',
            }}
            className="text-4xl md:text-5xl xl:text-6xl font-bold leading-[1.1] mb-6 text-[#F5EFE3] animate-fade-up"
          >
            Living with epilepsy,
            <br />
            <span className="text-[#CFE0D8]">never alone.</span>
          </h1>

          <p
            className="text-lg text-[#CFE0D8] max-w-lg mb-10 leading-relaxed animate-fade-up"
            style={{ animationDelay: '200ms' }}
          >
            epimoyo connects patients, families, and clinical teams — tracking
            seizures, managing medications, and coordinating care in real time
            so nothing falls through the cracks.
          </p>

          <div
            className="flex flex-col sm:flex-row items-start gap-4 mb-12 animate-fade-up"
            style={{ animationDelay: '300ms' }}
          >
            <a
              href="#download"
              className="font-semibold bg-[#E8603C] text-white px-7 py-3.5 rounded-xl hover:bg-[#c94e2d] transition-colors text-base"
            >
              Download the app
            </a>
          </div>

          {/* Live ECG */}
          <div
            className="animate-fade-up"
            style={{ animationDelay: '450ms' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-[#6B8588] uppercase tracking-wider">
                Live ECG signal
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1F7A72] animate-bpm-pulse" />
            </div>
            <svg
              viewBox="0 0 360 56"
              width="360"
              height="56"
              className="max-w-full"
              aria-hidden="true"
            >
              {/* Faint grid lines */}
              {[14, 28, 42].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="360"
                  y2={y}
                  stroke="#1F7A72"
                  strokeWidth="0.3"
                  opacity="0.2"
                />
              ))}
              <path
                d="M0,28 L38,28 L45,28 L52,13 L57,43 L61,4 L65,52 L69,28 L78,28 L85,20 L89,28 L102,28 L128,28 L135,28 L142,13 L147,43 L151,4 L155,52 L159,28 L168,28 L175,20 L179,28 L192,28 L218,28 L225,28 L232,13 L237,43 L241,4 L245,52 L249,28 L258,28 L265,20 L269,28 L282,28 L308,28 L315,28 L322,13 L327,43 L331,4 L335,52 L339,28 L348,28 L355,20 L360,28"
                stroke="#1F7A72"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="2000"
                className="animate-ecg-draw"
                style={{ animationDelay: '0.3s', animationDuration: '2.8s' }}
              />
            </svg>
          </div>
        </div>

        {/* Right: phone mockup */}
        <div className="flex justify-center lg:justify-end">
          <div className="animate-float" style={{ animationDelay: '0.2s' }}>
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
