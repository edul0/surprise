import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import YouTube from 'react-youtube';
import './index.css';

/* ─── DATA ─────────────────────────────────────────────── */
const TRACKS = [
  { id: '1Lhwn4PqeGpM4LTVUowW76', title: 'Lovers Rock',        artist: 'TV Girl'          },
  { id: '07q0QVgO56EorrSGHC48y3', title: 'I Was Made For You', artist: 'Albert Hammond Jr' },
  { id: '4qS2KPWvsQzLvRa9oCHw41', title: 'Ocean Eyes',         artist: 'Billie Eilish'    },
  { id: '1AZXNAVDD9ZFIEKySgflFz', title: 'Chasing Cars',       artist: 'Snow Patrol'      },
  { id: '2HvuyQEnKR82zwfIuCBaWH', title: 'My Love',            artist: 'Sia'              },
  { id: '1DLKuppSYytOuxhtI6KBGu', title: 'Die For You',        artist: 'The Weeknd'       },
  { id: '0eAuGrXyGFYwur9ARUe7LJ', title: 'Electric Love',      artist: 'BØRNS'            },
  { id: '33YkiqLWsxzZdi8Z1AKyIk', title: 'Dandelions',         artist: 'Ruth B.'          },
];

const SPAM = [
  'Minha dragoa ♡', 'Te amo infinitamente', 'Você é perfeita', 'Helena',
  'Para sempre', 'Meu maior amor', 'Razão do meu viver', 'Minha vida',
  'Case comigo', 'Impossível não te amar', 'Meu coração é seu', 'Só você',
  'Eterna', 'Eu te escolho todo dia', 'Minha deusa', 'Amo você demais',
  'Cada dia mais', 'Você me completa', 'Meu tudo', 'Sempre com você',
];

const LYRICS = [
  'Helena Narloch,',
  'você entrou na minha vida',
  'e reescreveu tudo.',
  'Cada música aqui',
  'carrega um pedaço nosso.',
  'Um sorriso, uma memória,',
  'uma história que continua.',
  'Feliz Dia dos Namorados,',
  'minha eterna dragoa. ❤',
];

function fmt(s) {
  if (!s || isNaN(s) || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/* ─── CANVAS PARTICLE HEARTS ───────────────────────────── */
function Particles({ count = 22, active = true }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return;
    const c = ref.current;
    const ctx = c.getContext('2d');
    let raf;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const P = Array.from({ length: count }, () => ({
      x: Math.random() * c.width,
      y: c.height + Math.random() * c.height,
      r: 5 + Math.random() * 10,
      speed: 0.35 + Math.random() * 0.7,
      drift: (Math.random() - 0.5) * 0.4,
      a: 0.15 + Math.random() * 0.4,
      rot: Math.random() * Math.PI * 2,
      rs: (Math.random() - 0.5) * 0.015,
    }));
    const heart = (x, y, r, rot, a) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
      ctx.fillStyle = '#c9415a';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.28);
      ctx.bezierCurveTo(r * 0.52, -r * 0.78, r, -r * 0.12, 0, r * 0.7);
      ctx.bezierCurveTo(-r, -r * 0.12, -r * 0.52, -r * 0.78, 0, -r * 0.28);
      ctx.closePath(); ctx.fill(); ctx.restore();
    };
    const loop = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      P.forEach(p => {
        p.y -= p.speed; p.x += p.drift; p.rot += p.rs;
        if (p.y < -20) { p.y = c.height + 20; p.x = Math.random() * c.width; }
        heart(p.x, p.y, p.r, p.rot, p.a);
      });
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [count, active]);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }} />;
}

/* ─── FILM GRAIN OVERLAY ────────────────────────────────── */
function FilmGrain() {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        opacity: 0.45,
        mixBlendMode: 'overlay',
      }}
    />
  );
}

/* ─── VISUALIZER ─────────────────────────────────────────── */
function Visualizer({ playing, bars = 24 }) {
  const heights = useRef(Array.from({ length: bars }, () => 3 + Math.random() * 20));
  const [, tick] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      heights.current = heights.current.map(h => {
        const delta = (Math.random() - 0.5) * 10;
        return Math.max(3, Math.min(28, h + delta));
      });
      tick(t => t + 1);
    }, 80);
    return () => clearInterval(iv);
  }, [playing, bars]);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
      {heights.current.map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 4,
          height: playing ? h : 3,
          background: 'linear-gradient(180deg, #c9415a, #c9a84c)',
          transition: 'height 0.08s ease',
        }} />
      ))}
    </div>
  );
}

/* ─── PHASE –1: CINEMATIC TITLE SCREEN ──────────────────── */
function PhaseCinema({ onEnd }) {
  useEffect(() => { const t = setTimeout(onEnd, 3800); return () => clearTimeout(t); }, [onEnd]);
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: '#050005', zIndex: 100 }}
      exit={{ opacity: 0, transition: { duration: 1.2 } }}
    >
      <Particles count={14} />
      <div className="text-center" style={{ zIndex: 10 }}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: 1, background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)', marginBottom: 28 }}
        />
        <motion.p
          initial={{ opacity: 0, y: 8, letterSpacing: '1em' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '0.45em' }}
          transition={{ delay: 0.5, duration: 1.2 }}
          style={{ fontSize: 11, color: '#c9a84c', textTransform: 'uppercase', fontFamily: 'Inter', fontWeight: 300, marginBottom: 20 }}
        >
          12 de junho de 2026
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: 'blur(14px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.9, duration: 1.4 }}
          style={{
            fontFamily: 'Cormorant Garamond', fontWeight: 300, fontStyle: 'italic',
            fontSize: 'clamp(2.8rem, 8vw, 6rem)', color: '#f5f0ea', lineHeight: 1.15
          }}
        >
          Para a Minha<br />Dragoa
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.6, duration: 0.8, ease: 'easeOut' }}
          style={{ height: 1, background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)', marginTop: 28 }}
        />
      </div>
    </motion.div>
  );
}

/* ─── PHASE 0: 3D ENVELOPE ───────────────────────────────── */
function PhaseEnvelope({ onOpen }) {
  const [opened, setOpened] = useState(false);
  const [letterOut, setLetterOut] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotX = useSpring(useTransform(mouseY, [-300, 300], [12, -12]), { stiffness: 80, damping: 20 });
  const rotY = useSpring(useTransform(mouseX, [-400, 400], [-14, 14]), { stiffness: 80, damping: 20 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  const handleClick = () => {
    if (opened || letterOut) return;
    setOpened(true);
    setTimeout(() => setLetterOut(true), 700);
    setTimeout(() => onOpen(), 2000);
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 60%, #120008 0%, #050005 100%)', zIndex: 50 }}
      exit={{ opacity: 0, filter: 'blur(20px)', transition: { duration: 1 } }}
    >
      <Particles count={18} />

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: letterOut ? 0 : 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        style={{
          position: 'absolute', top: '28%',
          fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase',
          color: '#6b5c60', fontFamily: 'Inter', fontWeight: 300, zIndex: 10
        }}
      >
        {opened ? 'uma surpresa para você...' : 'clique no envelope'}
      </motion.p>

      {/* 3D Envelope wrapper */}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          width: 380, height: 260,
          perspective: 900,
          zIndex: 10,
          cursor: opened ? 'default' : 'pointer',
          position: 'relative',
        }}
      >
        <motion.div
          style={{
            width: '100%', height: '100%',
            rotateX, rotateY,
            transformStyle: 'preserve-3d',
            position: 'relative',
          }}
          whileHover={!opened ? { scale: 1.04 } : {}}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          {/* ── ENVELOPE BODY ── */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #1e0510 0%, #130309 60%, #0e0207 100%)',
            borderRadius: 6,
            border: '1px solid rgba(201,168,76,0.2)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
            overflow: 'hidden',
          }}>
            {/* Inside envelope (visible when opened) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: opened ? 1 : 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, #0a0205, #120308)',
              }}
            />
            {/* Bottom V fold */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
              background: 'linear-gradient(180deg, #1a0510, #0e0308)',
              clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
              borderTop: '1px solid rgba(201,168,76,0.12)',
            }} />
            {/* Left fold */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%',
              background: 'rgba(255,255,255,0.015)',
              clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
            }} />
            {/* Right fold */}
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%',
              background: 'rgba(0,0,0,0.1)',
              clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
            }} />
          </div>

          {/* ── ENVELOPE FLAP (opens on click) ── */}
          <motion.div
            animate={{ rotateX: opened ? -180 : 0, originY: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '52%',
              transformOrigin: 'top',
              transformStyle: 'preserve-3d',
              zIndex: 5,
            }}
          >
            {/* Front of flap */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(175deg, #2a0814 0%, #1a0510 50%, #120309 100%)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              borderBottom: '1px solid rgba(201,168,76,0.15)',
              backfaceVisibility: 'hidden',
            }} />
            {/* Back of flap (inner side) */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(175deg, #f5f0ea 0%, #ede0d0 100%)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              backfaceVisibility: 'hidden',
              transform: 'rotateX(180deg)',
            }} />
          </motion.div>

          {/* ── WAX SEAL ── */}
          <motion.div
            animate={{ 
              scale: opened ? 0 : 1, 
              opacity: opened ? 0 : 1,
              y: opened ? 20 : 0,
            }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', top: '38%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 52, height: 52,
              background: 'radial-gradient(circle at 35% 35%, #f0d080, #c9a84c 50%, #9a7832)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, zIndex: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5), 0 0 20px rgba(201,168,76,0.3), inset 0 1px 2px rgba(255,255,255,0.3)',
            }}
          >
            ♡
          </motion.div>

          {/* ── THE LETTER ── */}
          <motion.div
            animate={letterOut ? { y: -220, opacity: 1 } : { y: 0, opacity: 0 }}
            initial={{ y: 0, opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute', inset: '10% 8%', bottom: '15%',
              background: 'linear-gradient(160deg, #fdf8f2, #f0e8da)',
              borderRadius: 3, zIndex: 4,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
              padding: '20px 24px',
            }}
          >
            {/* Decorative line top */}
            <div style={{ width: '60%', height: 1, background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />
            <p style={{
              fontFamily: 'Dancing Script, cursive',
              fontSize: 30, color: '#3a1020', lineHeight: 1.3, textAlign: 'center'
            }}>
              Para Helena,<br/>com todo meu amor
            </p>
            <div style={{ width: '40%', height: 1, background: 'linear-gradient(90deg, transparent, #c9a84c80, transparent)' }} />
            <p style={{ fontSize: 11, letterSpacing: '0.3em', color: '#8a6050', fontFamily: 'Inter', fontWeight: 300 }}>
              ABRIR ▸
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ─── PHASE 1: SPAM ──────────────────────────────────────── */
function PhaseSpam() {
  const words = useMemo(() => Array.from({ length: 42 }, (_, i) => {
    const odd = i % 2 === 0;
    return {
      text: SPAM[i % SPAM.length],
      x: 3 + Math.random() * 92,
      y: 3 + Math.random() * 92,
      size: odd ? 16 + Math.random() * 22 : 32 + Math.random() * 36,
      delay: Math.random() * 2.2,
      dur: 0.7 + Math.random() * 1.0,
      filled: Math.random() > 0.45,
      rot: (Math.random() - 0.5) * 18,
    };
  }), []);

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, #1a0010 0%, #050005 70%)',
        zIndex: 40,
      }}
      exit={{ opacity: 0, filter: 'blur(12px)', transition: { duration: 1 } }}
    >
      {/* Giant heart bg */}
      <motion.div
        initial={{ opacity: 0, scale: 3 }}
        animate={{ opacity: [0, 0.07, 0.04], scale: [3, 1.2, 0.9] }}
        transition={{ duration: 4, ease: 'easeOut' }}
        style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Cormorant Garamond',
          fontSize: '60vw', color: '#c9415a', lineHeight: 1, pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        ♡
      </motion.div>

      {words.map((w, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: `${w.x}%`, top: `${w.y}%`,
            fontSize: w.size,
            transform: `translate(-50%,-50%) rotate(${w.rot}deg)`,
            fontFamily: 'Cormorant Garamond',
            fontWeight: 300,
            color: w.filled ? '#c9415a' : 'transparent',
            WebkitTextStroke: w.filled ? 'none' : '1px rgba(201,65,90,0.6)',
            textShadow: w.filled ? '0 0 25px rgba(201,65,90,0.5)' : 'none',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
          initial={{ opacity: 0, scale: 0.2, filter: 'blur(10px)' }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.2, 1, 1.05, 1.3], filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(8px)'] }}
          transition={{ delay: w.delay, duration: w.dur, ease: 'easeOut' }}
        >
          {w.text}
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── PHASE 2: INVITATION ────────────────────────────────── */
function PhaseInvitation() {
  const lines = [
    { text: '— convite especial —', delay: 0.2, style: { fontSize: 11, letterSpacing: '0.4em', color: '#c9a84c', fontFamily: 'Inter', fontWeight: 300, textTransform: 'uppercase' } },
    { text: null, delay: 0 }, // divider
    { text: 'Helena Narloch,', delay: 0.8, style: { fontFamily: 'Cormorant Garamond', fontSize: 'clamp(2.4rem,7vw,5.2rem)', fontWeight: 300, fontStyle: 'italic', color: '#f5f0ea', lineHeight: 1.2 } },
    { text: 'você está convidada', delay: 1.2, style: { fontFamily: 'Cormorant Garamond', fontSize: 'clamp(1.6rem,4vw,3rem)', fontWeight: 300, color: '#c9c0ba', lineHeight: 1.4 } },
    { text: null, delay: 0 }, // divider
    { text: 'para a nossa trilha sonora', delay: 1.8, style: { fontFamily: 'Cormorant Garamond', fontStyle: 'italic', fontSize: 'clamp(1rem,2.5vw,1.4rem)', color: '#c9a84c', letterSpacing: '0.05em' } },
  ];

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 40% 30%, rgba(92,10,35,0.35) 0%, transparent 60%), #080008', zIndex: 40 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, transition: { duration: 1.2 } }}
    >
      <Particles count={14} />

      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', maxWidth: 680, padding: '0 32px', zIndex: 10 }}
      >
        {lines.map((line, i) => line.text === null ? (
          <motion.div
            key={i}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i === 1 ? 0.5 : 1.5, duration: 1, ease: 'easeOut' }}
            style={{ height: 1, background: 'linear-gradient(90deg,transparent,#c9a84c,transparent)', margin: '24px auto', width: 220 }}
          />
        ) : (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: line.delay, duration: 1, ease: 'easeOut' }}
            style={line.style}
          >
            {line.text}
          </motion.p>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ─── PHASE 3: GALLERY ───────────────────────────────────── */
function PhaseGallery() {
  const items = [
    { caption: 'Sempre juntos ❤', rotate: -5, x: '-38%', delay: 0.1, scale: 0.85 },
    { caption: 'Minha dragoa',     rotate: 1,  x:   '0%', delay: 0.5, scale: 1    },
    { caption: 'Para sempre',      rotate: 6,  x:  '38%', delay: 0.9, scale: 0.85 },
  ];

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: '#050005', zIndex: 40, perspective: 1500 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
    >
      <Particles count={12} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(92,10,35,0.2) 0%, transparent 60%)', pointerEvents: 'none' }} />

      {items.map((item, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            translateX: item.x,
            rotate: item.rotate,
            scale: item.scale,
            zIndex: i === 1 ? 5 : 3,
          }}
          initial={{ opacity: 0, y: 180, rotateX: 50 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: item.delay, duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: item.scale * 1.05, rotate: 0, zIndex: 10, transition: { duration: 0.3 } }}
        >
          {/* Polaroid */}
          <div style={{
            background: '#fff',
            padding: '14px 14px 52px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)',
            borderRadius: 2,
            width: 220,
          }}>
            {/* Photo reveal */}
            <div style={{ width: 192, height: 192, overflow: 'hidden', position: 'relative' }}>
              <motion.div
                initial={{ y: '0%' }}
                animate={{ y: '-100%' }}
                transition={{ delay: item.delay + 0.6, duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
                style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 2 }}
              />
              <img
                src="/collage.jpg"
                alt="Helena"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=400'; }}
              />
            </div>
            <p style={{ fontFamily: 'Dancing Script, cursive', color: '#555', fontSize: 17, textAlign: 'center', marginTop: 10 }}>
              {item.caption}
            </p>
          </div>
        </motion.div>
      ))}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ delay: 3, duration: 1 }}
        style={{
          position: 'absolute', bottom: '10%',
          fontSize: 10, letterSpacing: '0.4em', color: '#6b5c60',
          fontFamily: 'Inter', fontWeight: 300, textTransform: 'uppercase', zIndex: 10
        }}
      >
        preparando a playlist...
      </motion.p>
    </motion.div>
  );
}

/* ─── PHASE 4: PLAYER ────────────────────────────────────── */
function PhasePlayer({ ytPlayer, playing, toggle, currentTime, duration, onSeek }) {
  const [lyrics, setLyrics] = useState(false);
  const [activeLyric, setActiveLyric] = useState(0);
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    if (!lyrics) return;
    const el = document.getElementById('lyrics-root');
    if (!el) return;
    const fn = () => setActiveLyric(Math.min(Math.floor(el.scrollTop / 140), LYRICS.length - 1));
    el.addEventListener('scroll', fn);
    return () => el.removeEventListener('scroll', fn);
  }, [lyrics]);

  return (
    <motion.div
      style={{ minHeight: '100vh', paddingBottom: 100 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      <Particles count={8} />

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(92,10,35,0.55) 0%, rgba(13,5,8,0.92) 50%, transparent 100%)',
        padding: 'clamp(60px,10vw,100px) clamp(24px,6vw,80px) 40px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 36, position: 'relative', zIndex: 10,
      }}>
        {/* Cover 3D */}
        <motion.div
          initial={{ opacity: 0, rotateY: -20, y: 30 }}
          animate={{ opacity: 1, rotateY: 0, y: 0 }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ flexShrink: 0, perspective: 800, position: 'relative' }}
        >
          <motion.div
            animate={{ rotateY: [0, 4, 0, -4, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 'clamp(160px,22vw,220px)', aspectRatio: '1', transformStyle: 'preserve-3d' }}
          >
            <img
              src="/collage.jpg"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, display: 'block', boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 50px rgba(201,65,90,0.15)' }}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=600'; }}
            />
          </motion.div>
          {/* Reflection */}
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, height: 60, background: 'linear-gradient(180deg, rgba(255,255,255,0.06), transparent)', transform: 'scaleY(-0.4)', filter: 'blur(2px)', opacity: 0.4, borderRadius: 4 }} />
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <p style={{ fontSize: 10, letterSpacing: '0.4em', color: '#c9a84c', textTransform: 'uppercase', fontFamily: 'Inter', fontWeight: 300, marginBottom: 14 }}>
            ♡ Playlist exclusiva
          </p>
          <h1 style={{
            fontFamily: 'Cormorant Garamond', fontWeight: 300, fontStyle: 'italic',
            fontSize: 'clamp(2.4rem,6vw,4.8rem)', lineHeight: 1.15,
            background: 'linear-gradient(90deg, #f5f0ea, #c9a84c, #f5f0ea)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'shimmer 5s linear infinite',
            marginBottom: 14,
          }}>
            Para a Minha<br/>Dragoa
          </h1>
          <p style={{ fontSize: 13, fontWeight: 300, color: '#8a7070', lineHeight: 1.8, maxWidth: 460, marginBottom: 14 }}>
            As músicas que embalam o nosso amor.<br/>Para você, Helena Narloch, no Dia dos Namorados.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#6b5c60' }}>
            <span style={{ color: '#c9415a' }}>♡</span>
            <span>Seu Namorado</span>
            <span style={{ color: '#3a2030' }}>·</span>
            <span>{TRACKS.length} músicas</span>
          </div>
        </motion.div>
      </div>

      {/* ── CONTROLS ── */}
      <div style={{ padding: '0 clamp(24px,6vw,80px) 16px', display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 10 }}>
        <button
          onClick={toggle}
          style={{
            width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #c9415a, #7a1230)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(201,65,90,0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 0 45px rgba(201,65,90,0.6)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(201,65,90,0.4)'; }}
        >
          {playing
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 3 }}><polygon points="5,3 19,12 5,21"/></svg>
          }
        </button>

        <Visualizer playing={playing} />

        <button
          onClick={() => setLyrics(v => !v)}
          style={{
            marginLeft: 'auto', background: 'none', border: `1px solid ${lyrics ? 'rgba(201,65,90,0.6)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 100, padding: '8px 20px', cursor: 'pointer', color: lyrics ? '#c9415a' : '#8a7070',
            fontSize: 11, letterSpacing: '0.25em', fontFamily: 'Inter', fontWeight: 400,
            textTransform: 'uppercase', transition: 'all 0.25s',
          }}
        >
          {lyrics ? 'fechar mensagem' : 'ver mensagem ♡'}
        </button>
      </div>

      {/* ── TRACKLIST ── */}
      <div style={{ padding: '8px clamp(24px,6vw,80px)', position: 'relative', zIndex: 10 }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10, marginBottom: 4, fontSize: 10, letterSpacing: '0.3em', color: '#4a3040', textTransform: 'uppercase', fontFamily: 'Inter' }}>
          Faixas
        </div>
        {TRACKS.map((track, i) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' }}
          >
            <iframe
              src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`}
              width="100%" height="80" frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ display: 'block', background: 'transparent', borderRadius: 4 }}
            />
          </motion.div>
        ))}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ marginTop: 80, marginBottom: 40, textAlign: 'center' }}
        >
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)', marginBottom: 24 }} />
          <p style={{ fontSize: 11, letterSpacing: '0.4em', color: '#4a3040', fontFamily: 'Inter', fontWeight: 300, textTransform: 'uppercase' }}>
            feito com amor ♡
          </p>
        </motion.div>
      </div>

      {/* ── LYRICS OVERLAY ── */}
      <AnimatePresence>
        {lyrics && (
          <motion.div
            id="lyrics-root"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
            style={{
              position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 70,
              background: 'radial-gradient(ellipse at 25% 20%, rgba(92,10,35,0.5), transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(10,0,20,0.9), transparent 60%), #060206',
            }}
          >
            <div style={{ paddingTop: '42vh', paddingBottom: '60vh', padding: '42vh max(8vw, 32px) 60vh' }}>
              {LYRICS.map((line, i) => (
                <motion.p
                  key={i}
                  style={{
                    fontFamily: 'Cormorant Garamond', fontStyle: 'italic',
                    fontSize: 'clamp(1.8rem, 4.5vw, 3.8rem)',
                    fontWeight: 300, lineHeight: 1.4, marginBottom: '2.5rem',
                    opacity: activeLyric >= i ? 1 : 0.18,
                    color: activeLyric >= i ? '#f5f0ea' : '#8a7070',
                    transform: activeLyric >= i ? 'translateX(16px)' : 'translateX(0)',
                    transition: 'opacity 0.7s, color 0.7s, transform 0.5s',
                  }}
                >
                  {line}
                </motion.p>
              ))}
            </div>
            <button
              onClick={() => setLyrics(false)}
              style={{
                position: 'fixed', top: 24, right: 24,
                background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%',
                width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#8a7070', transition: 'color 0.2s',
                zIndex: 80,
              }}
              onMouseOver={e => e.currentTarget.style.color = '#f5f0ea'}
              onMouseOut={e => e.currentTarget.style.color = '#8a7070'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────── */
export default function App() {
  const [phase, setPhase] = useState(-1); // -1 = cinema, 0 = envelope, etc.
  const [ytPlayer, setYtPlayer] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (phase === 1) { const t = setTimeout(() => setPhase(2), 4400); return () => clearTimeout(t); }
    if (phase === 2) { const t = setTimeout(() => setPhase(3), 4000); return () => clearTimeout(t); }
    if (phase === 3) { const t = setTimeout(() => { setPhase(4); window.scrollTo(0, 0); }, 5800); return () => clearTimeout(t); }
  }, [phase]);

  useEffect(() => {
    if (!playing || !ytPlayer) return;
    const iv = setInterval(async () => {
      try {
        setCurrentTime(await ytPlayer.getCurrentTime());
        const d = await ytPlayer.getDuration();
        if (d > 0) setDuration(d);
      } catch {}
    }, 1000);
    return () => clearInterval(iv);
  }, [playing, ytPlayer]);

  const openEnvelope = () => {
    setPhase(1);
    try { ytPlayer?.playVideo(); } catch {}
  };

  const toggle = () => {
    if (!ytPlayer) return;
    playing ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
  };

  const onSeek = (e) => {
    if (!ytPlayer || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
    ytPlayer.seekTo(t, true);
    setCurrentTime(t);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060206', color: '#e8ddd8', position: 'relative', overflow: 'hidden' }}>
      <FilmGrain />

      {/* Hidden YouTube streaming player */}
      <div style={{ position: 'fixed', left: -9999, top: -9999, pointerEvents: 'none', opacity: 0 }}>
        <YouTube
          videoId="S01614jS0pM"
          opts={{ playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0 } }}
          onReady={e => setYtPlayer(e.target)}
          onStateChange={e => { if (e.data === 1) setPlaying(true); else if (e.data === 2 || e.data === 0) setPlaying(false); }}
        />
      </div>

      <AnimatePresence>
        {phase === -1 && <PhaseCinema key="cinema" onEnd={() => setPhase(0)} />}
        {phase === 0  && <PhaseEnvelope key="env" onOpen={openEnvelope} />}
        {phase === 1  && <PhaseSpam key="spam" />}
        {phase === 2  && <PhaseInvitation key="inv" />}
        {phase === 3  && <PhaseGallery key="gal" />}
        {phase === 4  && <PhasePlayer key="player" ytPlayer={ytPlayer} playing={playing} toggle={toggle} currentTime={currentTime} duration={duration} onSeek={onSeek} />}
      </AnimatePresence>

      {/* ── BOTTOM BAR ── */}
      <AnimatePresence>
        {phase === 4 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100 }}
            transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, height: 76,
              background: 'rgba(6,2,6,0.97)', backdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(201,168,76,0.1)',
              display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px',
              zIndex: 100,
            }}
          >
            <img src="/collage.jpg" alt="" style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', minWidth: 100 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#e8ddd8' }}>Lovers Rock</span>
              <span style={{ fontSize: 11, color: '#6b5c60' }}>TV Girl</span>
            </div>
            <button
              onClick={toggle}
              style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0, background: 'linear-gradient(135deg, #c9415a, #7a1230)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(201,65,90,0.35)' }}
            >
              {playing
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}><polygon points="5,3 19,12 5,21"/></svg>
              }
            </button>
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ fontSize: 10, color: '#6b5c60', flexShrink: 0 }}>{fmt(currentTime)}</span>
              <div
                onClick={onSeek}
                style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', position: 'relative', minWidth: 0 }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct || 0}%`, background: 'linear-gradient(90deg, #c9415a, #c9a84c)', borderRadius: 8, transition: 'width 0.1s linear' }} />
              </div>
              <span style={{ fontSize: 10, color: '#6b5c60', flexShrink: 0 }}>{fmt(duration)}</span>
            </div>
            <Visualizer playing={playing} bars={16} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
