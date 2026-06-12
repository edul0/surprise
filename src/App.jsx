import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, animate } from 'framer-motion';
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

const COVER_FALLBACKS = ['/cover.svg'];

function fmt(s) {
  if (!s || isNaN(s) || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function chainFallback(urls) {
  return (e) => {
    const img = e.target;
    const step = Number(img.dataset.fallbackStep || 0);
    if (step < urls.length) {
      img.dataset.fallbackStep = step + 1;
      img.src = urls[step];
    }
  };
}

/* ─── SPOTIFY EMBED CONTROLLER (música real, direto da página) ── */
function useSpotifyPlayer() {
  const controllerRef = useRef(null);
  const nextRef = useRef(() => {});
  const endedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const trackIndexRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const init = (IFrameAPI) => {
      if (cancelled) return;
      const wrapper = document.getElementById('spotify-wrapper');
      if (!wrapper) return;
      wrapper.innerHTML = '';
      const slot = document.createElement('div');
      wrapper.appendChild(slot);
      IFrameAPI.createController(
        slot,
        { uri: `spotify:track:${TRACKS[0].id}`, width: 320, height: 80 },
        (controller) => {
          if (cancelled) { try { controller.destroy(); } catch { /* noop */ } return; }
          controllerRef.current = controller;
          controller.addListener('ready', () => { if (!cancelled) setReady(true); });
          controller.addListener('playback_update', (e) => {
            if (cancelled || !e?.data) return;
            const { isPaused, position: pos = 0, duration: dur = 0 } = e.data;
            setPlaying(!isPaused);
            setPosition(pos / 1000);
            if (dur > 0) setDuration(dur / 1000);
            // fim da faixa → próxima automaticamente
            if (dur > 0 && pos >= dur - 800 && isPaused) {
              if (!endedRef.current) { endedRef.current = true; nextRef.current(); }
            } else {
              endedRef.current = false;
            }
          });
        }
      );
    };

    if (window.__spotifyIframeApi) {
      init(window.__spotifyIframeApi);
    } else {
      window.onSpotifyIframeApiReady = (IFrameAPI) => {
        window.__spotifyIframeApi = IFrameAPI;
        init(IFrameAPI);
      };
      if (!document.querySelector('script[src*="open.spotify.com/embed/iframe-api"]')) {
        const s = document.createElement('script');
        s.src = 'https://open.spotify.com/embed/iframe-api/v1';
        s.async = true;
        document.body.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      try { controllerRef.current?.destroy(); } catch { /* noop */ }
      controllerRef.current = null;
    };
  }, []);

  const playTrack = useCallback((i) => {
    const idx = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
    setTrackIndex(idx);
    trackIndexRef.current = idx;
    setPosition(0);
    setDuration(0);
    const c = controllerRef.current;
    if (!c) return;
    try {
      c.loadUri(`spotify:track:${TRACKS[idx].id}`);
      c.play();
    } catch { /* noop */ }
  }, []);

  const next = useCallback(() => playTrack(trackIndexRef.current + 1), [playTrack]);
  const prev = useCallback(() => playTrack(trackIndexRef.current - 1), [playTrack]);
  useEffect(() => { nextRef.current = next; }, [next]);

  const toggle = useCallback(() => {
    try { controllerRef.current?.togglePlay(); } catch { /* noop */ }
  }, []);

  const begin = useCallback(() => {
    try { controllerRef.current?.play(); } catch { /* noop */ }
  }, []);

  const seek = useCallback((fraction) => {
    const c = controllerRef.current;
    if (!c || !duration) return;
    const t = Math.max(0, Math.min(1, fraction)) * duration;
    try { c.seek(t); setPosition(t); } catch { /* noop */ }
  }, [duration]);

  return { ready, trackIndex, playing, position, duration, playTrack, next, prev, toggle, begin, seek };
}

/* ─── FUNDO SHADER WEBGL (brilho vinho + faíscas douradas) ── */
const SHADER_VS = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const SHADER_FS = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    vec2 uv = v_texCoord;

    // Base dark gradient
    vec3 color = vec3(0.02, 0.0, 0.0);

    // Subtle wine red glow from bottom
    float glow = 1.0 - distance(uv, vec2(0.5, -0.2));
    color += vec3(0.36, 0.04, 0.14) * pow(max(0.0, glow), 3.0);

    // Cinematic film grain
    float grain = random(uv + fract(u_time * 0.01)) * 0.05;
    color += grain;

    // Soft floating gold sparks
    for(float i = 0.0; i < 8.0; i++) {
        float t = u_time * (0.2 + i * 0.1);
        vec2 p = vec2(
            0.5 + 0.3 * sin(t + i),
            0.2 + 0.6 * fract(0.2 * t + i * 0.5)
        );
        float size = 0.005 + 0.01 * sin(u_time + i);
        float dist = distance(uv, p);
        float spark = smoothstep(size, 0.0, dist);
        color += vec3(0.79, 0.66, 0.3) * spark * 0.5;
    }

    gl_FragColor = vec4(color, 1.0);
}`;

function ShaderBackground() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const syncSize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    };
    syncSize();
    window.addEventListener('resize', syncSize);

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, SHADER_VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, SHADER_FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    let raf;
    const render = (t) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', syncSize);
      try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* noop */ }
    };
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }} />;
}

/* ─── CANVAS PARTICLES: corações + faíscas douradas com profundidade ── */
function Particles({ count = 22 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext('2d');
    let raf;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const P = Array.from({ length: count }, () => {
      const depth = 0.25 + Math.random() * 0.75; // 0 = longe, 1 = perto
      const gold = Math.random() < 0.35;
      return {
        x: Math.random() * c.width,
        y: c.height * Math.random() + c.height * 0.3,
        depth, gold,
        r: gold ? 1 + depth * 2.4 : 4 + depth * 11,
        speed: 0.18 + depth * 0.62,
        sway: 14 + Math.random() * 26,
        swayF: 0.0006 + Math.random() * 0.0009,
        phase: Math.random() * Math.PI * 2,
        a: gold ? 0.25 + depth * 0.55 : 0.1 + depth * 0.38,
        rot: Math.random() * Math.PI * 2,
        rs: (Math.random() - 0.5) * 0.014,
        tw: Math.random() * Math.PI * 2,
      };
    });

    const heart = (x, y, r, rot, a) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
      ctx.fillStyle = '#c9415a';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.28);
      ctx.bezierCurveTo(r * 0.52, -r * 0.78, r, -r * 0.12, 0, r * 0.7);
      ctx.bezierCurveTo(-r, -r * 0.12, -r * 0.52, -r * 0.78, 0, -r * 0.28);
      ctx.closePath(); ctx.fill(); ctx.restore();
    };

    const spark = (x, y, r, a, t, tw) => {
      const twinkle = 0.55 + 0.45 * Math.sin(t * 0.004 + tw);
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a * twinkle;
      ctx.fillStyle = '#e8c96a';
      ctx.beginPath();
      ctx.moveTo(0, -r * 2); ctx.lineTo(r * 0.6, 0); ctx.lineTo(0, r * 2); ctx.lineTo(-r * 0.6, 0);
      ctx.closePath(); ctx.fill(); ctx.restore();
    };

    const loop = (t) => {
      ctx.clearRect(0, 0, c.width, c.height);
      P.forEach(p => {
        p.y -= p.speed;
        p.rot += p.rs;
        if (p.y < -24) { p.y = c.height + 24; p.x = Math.random() * c.width; }
        const x = p.x + Math.sin(t * p.swayF + p.phase) * p.sway * p.depth;
        if (p.gold) spark(x, p.y, p.r, p.a, t, p.tw);
        else heart(x, p.y, p.r, p.rot, p.a);
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [count]);
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

/* ─── VISUALIZER (barras dançando, suave por seno) ─────── */
function Visualizer({ playing, bars = 24 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const seeds = Array.from({ length: el.children.length }, () => ({
      f: 0.6 + Math.random() * 1.6,
      p: Math.random() * Math.PI * 2,
      a: 0.4 + Math.random() * 0.6,
    }));
    const loop = (t) => {
      for (let i = 0; i < el.children.length; i++) {
        const s = seeds[i];
        const h = playing
          ? 4 + Math.abs(Math.sin((t / 1000) * s.f * Math.PI + s.p)) * 22 * s.a + Math.random() * 2
          : 3;
        el.children[i].style.height = `${h}px`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, bars]);

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} style={{
          width: 3, borderRadius: 4, height: 3,
          background: 'linear-gradient(180deg, #c9a84c, #c9415a)',
          transition: 'height 0.1s ease',
        }} />
      ))}
    </div>
  );
}

/* ─── EXPLOSÃO DE CORAÇÕES (ao dar play) ─────────────────── */
function HeartBurst({ trigger }) {
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.div key={trigger} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2 + 0.4;
            return (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.3 }}
                animate={{ x: Math.cos(a) * 52, y: Math.sin(a) * 52, opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
                style={{
                  position: 'absolute', left: '50%', top: '50%',
                  marginLeft: -7, marginTop: -9,
                  color: i % 2 ? '#c9a84c' : '#c9415a', fontSize: 14,
                }}
              >
                ♥
              </motion.span>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
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
      <ShaderBackground />
      <Particles count={14} />
      {/* luz de vela tremeluzindo */}
      <motion.div
        animate={{ opacity: [0.35, 0.6, 0.42, 0.66, 0.4], scale: [1, 1.06, 0.98, 1.08, 1] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: '70vmin', height: '70vmin', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.13) 0%, rgba(92,10,35,0.1) 45%, transparent 70%)',
          filter: 'blur(10px)',
        }}
      />
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

/* ─── PHASE 0: ENVELOPE — puxe a carta, o lacre se desfaz ── */
function PhaseEnvelope({ onOpen }) {
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);

  // tilt 3D com o mouse
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotX = useSpring(useTransform(mouseY, [-300, 300], [12, -12]), { stiffness: 80, damping: 20 });
  const rotY = useSpring(useTransform(mouseX, [-400, 400], [-14, 14]), { stiffness: 80, damping: 20 });

  // física do puxão
  const dragY = useMotionValue(0);
  const pull = useTransform(dragY, [0, -200], [0, 1]);
  const sealScale = useTransform(pull, [0, 0.45], [1, 0]);
  const sealOpacity = useTransform(pull, [0, 0.42], [1, 0]);
  const flapRot = useTransform(pull, [0.08, 0.55], [0, -180]);
  const letterY = useTransform(pull, [0.12, 1], [0, -195]);
  const glowOpacity = useTransform(pull, [0, 1], [0.12, 0.5]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    animate(dragY, -200, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    setTimeout(onOpen, 1400);
  }, [dragY, onOpen]);

  const onDragEnd = () => {
    if (doneRef.current) return;
    if (dragY.get() < -110) {
      finish();
    } else {
      // tensão de elástico: volta com mola
      animate(dragY, 0, { type: 'spring', stiffness: 320, damping: 16 });
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: '#050000', zIndex: 50 }}
      exit={{ opacity: 0, filter: 'blur(20px)', transition: { duration: 1 } }}
    >
      <ShaderBackground />
      <Particles count={18} />

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: done ? 0 : 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        style={{
          position: 'absolute', top: '11%',
          fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase',
          color: '#8a7070', fontFamily: 'Inter', fontWeight: 300, zIndex: 10, textAlign: 'center',
        }}
      >
        puxe a carta para cima ♡
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: done ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'absolute', top: '11%',
          fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase',
          color: '#c9a84c', fontFamily: 'Inter', fontWeight: 300, zIndex: 10,
        }}
      >
        uma surpresa para você...
      </motion.p>

      {/* 3D Envelope wrapper — flutua como na referência */}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ y: [0, -14, 0], rotate: [-1.2, 1.2, -1.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 380, height: 260, maxWidth: '88vw', perspective: 900, zIndex: 10, position: 'relative' }}
      >
        {/* luz dourada vinda de cima à direita */}
        <div style={{
          position: 'absolute', top: -90, right: -90, width: 240, height: 240, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.28), transparent 65%)',
          filter: 'blur(20px)', pointerEvents: 'none',
        }} />
        {/* brilho dourado que cresce conforme o puxão */}
        <motion.div style={{
          position: 'absolute', inset: -60, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.35), transparent 65%)',
          opacity: glowOpacity, filter: 'blur(18px)', pointerEvents: 'none',
        }} />

        <motion.div
          style={{
            width: '100%', height: '100%',
            rotateX: rotX, rotateY: rotY,
            transformStyle: 'preserve-3d',
            position: 'relative',
          }}
        >
          {/* ── CORPO DO ENVELOPE (papel creme) ── */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #f7f1e6 0%, #ece2d0 60%, #e0d4bd 100%)',
            borderRadius: 6,
            border: '1px solid rgba(201,168,76,0.5)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 50px rgba(201,168,76,0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
            overflow: 'hidden',
          }}>
            {/* Bottom V fold */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
              background: 'linear-gradient(180deg, #f2ebdb, #e4d8c1)',
              clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
              borderTop: '1px solid rgba(154,120,50,0.25)',
              filter: 'drop-shadow(0 -2px 3px rgba(92,10,35,0.08))',
            }} />
            {/* Left fold */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%',
              background: 'rgba(255,255,255,0.35)',
              clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
            }} />
            {/* Right fold */}
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%',
              background: 'rgba(92,10,35,0.05)',
              clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
            }} />
            {/* Destinatária em caligrafia */}
            <p style={{
              position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center',
              fontFamily: 'Dancing Script, cursive', fontSize: 24, color: '#5c0a23',
              opacity: 0.85, pointerEvents: 'none',
            }}>
              Helena Narloch ♡
            </p>
            {/* Selo postal dourado */}
            <div style={{
              position: 'absolute', top: 12, right: 14, width: 38, height: 46,
              border: '1.5px dashed rgba(154,120,50,0.55)', borderRadius: 2,
              background: 'linear-gradient(160deg, rgba(201,168,76,0.18), rgba(201,168,76,0.05))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#9a7832', transform: 'rotate(3deg)',
              pointerEvents: 'none',
            }}>
              ♥
            </div>
          </div>

          {/* ── ABA DO ENVELOPE (abre conforme o puxão) ── */}
          <motion.div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '52%',
              rotateX: flapRot,
              transformOrigin: 'top',
              transformStyle: 'preserve-3d',
              zIndex: 5,
            }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(175deg, #f4ecdc 0%, #eadfc9 50%, #ddd0b5 100%)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              borderBottom: '1px solid rgba(154,120,50,0.3)',
              backfaceVisibility: 'hidden',
              filter: 'drop-shadow(0 3px 4px rgba(92,10,35,0.12))',
            }} />
            {/* forro interno em vinho, revelado quando a aba abre */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(175deg, #5c0a23 0%, #3a0615 100%)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              backfaceVisibility: 'hidden',
              transform: 'rotateX(180deg)',
            }} />
          </motion.div>

          {/* ── LACRE DE CERA VINHO (se desfaz conforme você puxa) ── */}
          <motion.div
            style={{
              position: 'absolute', top: '38%', left: '50%',
              marginLeft: -26, marginTop: -26,
              scale: sealScale, opacity: sealOpacity,
              width: 52, height: 52,
              background: 'radial-gradient(circle at 35% 35%, #8a1838, #5c0a23 55%, #3a0615)',
              borderRadius: '46% 54% 52% 48% / 52% 48% 54% 46%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, zIndex: 6, color: '#c9a84c',
              boxShadow: '0 4px 14px rgba(58,6,21,0.55), 0 0 22px rgba(92,10,35,0.45), inset 0 2px 3px rgba(255,255,255,0.18), inset 0 -2px 4px rgba(0,0,0,0.35)',
            }}
          >
            ♡
          </motion.div>

          {/* ── JANELA DE REVELAÇÃO: a carta emerge por aqui ao puxar ── */}
          <div style={{
            position: 'absolute', left: '8%', right: '8%', bottom: '99%', height: 300,
            overflow: 'hidden', zIndex: 8, pointerEvents: 'none',
          }}>
            <motion.div
              style={{
                position: 'absolute', left: 0, right: 0, top: '100%', height: 195,
                y: letterY,
                background: 'linear-gradient(160deg, #fffdf8, #f6efe2)',
                borderRadius: 3,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 9,
                boxShadow: '0 -12px 36px rgba(0,0,0,0.35), 0 0 0 1px rgba(201,168,76,0.3)',
                padding: '18px 22px',
              }}
            >
              <div style={{ width: '60%', height: 1, background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />
              <p style={{
                fontFamily: 'Dancing Script, cursive',
                fontSize: 26, color: '#5c0a23', lineHeight: 1.3, textAlign: 'center'
              }}>
                Para Helena,<br />com todo meu amor
              </p>
              <div style={{ width: '40%', height: 1, background: 'linear-gradient(90deg, transparent, #c9a84c80, transparent)' }} />
              <p style={{ fontSize: 9, letterSpacing: '0.32em', color: '#9a7832', fontFamily: 'Inter', fontWeight: 400, textTransform: 'uppercase' }}>
                12 · 06 · 2026
              </p>
            </motion.div>
          </div>

          {/* ── CAMADA DE ARRASTO (invisível, tensão de elástico) ── */}
          <motion.div
            drag={done ? false : 'y'}
            dragConstraints={{ top: -200, bottom: 0 }}
            dragElastic={0.55}
            onDragEnd={onDragEnd}
            onTap={finish}
            style={{
              position: 'absolute', inset: '-12% -6%',
              y: dragY,
              zIndex: 20,
              cursor: done ? 'default' : 'grab',
              touchAction: 'none',
            }}
            whileDrag={{ cursor: 'grabbing' }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ─── PHASE 1: UNIVERSO 3D DE PALAVRAS ───────────────────── */
const UNIVERSE_WORDS = Array.from({ length: 54 }, (_, i) => {
  const depth = Math.random(); // 0 = fundo, 1 = perto
  return {
    text: SPAM[i % SPAM.length],
    x: 6 + Math.random() * 88,
    y: 6 + Math.random() * 88,
    z: -560 + depth * 760,
    size: 16 + Math.random() * 38,
    delay: Math.random() * 2.8,
    dur: 2.2 + Math.random() * 1.8,
    filled: Math.random() > 0.5,
    rot: (Math.random() - 0.5) * 16,
    maxO: 0.45 + depth * 0.55,
  };
});

function PhaseUniverse() {
  const words = UNIVERSE_WORDS;

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, #1a0010 0%, #050005 70%)',
        zIndex: 40,
        perspective: 900,
      }}
      exit={{ opacity: 0, filter: 'blur(12px)', transition: { duration: 1 } }}
    >
      <Particles count={16} />

      {/* Coração gigante de fundo */}
      <motion.div
        initial={{ opacity: 0, scale: 3 }}
        animate={{ opacity: [0, 0.07, 0.04], scale: [3, 1.2, 0.9] }}
        transition={{ duration: 5, ease: 'easeOut' }}
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

      {/* câmera atravessando o universo de palavras */}
      <motion.div
        style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}
        initial={{ z: 0, rotateY: -4, rotateX: 2 }}
        animate={{ z: 340, rotateY: 5, rotateX: -3 }}
        transition={{ duration: 7, ease: 'easeInOut' }}
      >
        {words.map((w, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: `${w.x}%`, top: `${w.y}%`,
              x: '-50%', y: '-50%', z: w.z, rotate: w.rot,
              fontSize: w.size,
              fontFamily: 'Cormorant Garamond',
              fontWeight: 300,
              color: w.filled ? '#c9415a' : 'transparent',
              WebkitTextStroke: w.filled ? undefined : '1px rgba(201,65,90,0.6)',
              textShadow: w.filled ? '0 0 25px rgba(201,65,90,0.5)' : 'none',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: [0, w.maxO, w.maxO, 0], filter: ['blur(8px)', 'blur(0px)', 'blur(0px)', 'blur(6px)'] }}
            transition={{ delay: w.delay, duration: w.dur, times: [0, 0.25, 0.75, 1], ease: 'easeOut' }}
          >
            {w.text}
          </motion.div>
        ))}
      </motion.div>
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

/* ─── PHASE 3: POLAROIDS COM REVELAÇÃO FOTOGRÁFICA ───────── */
function PhaseGallery() {
  const items = [
    { caption: 'Sempre juntos ❤', rotate: -5, x: '-38%', delay: 0.1, scale: 0.85, src: '/photo1.jpg', fb: ['/polaroid1.svg'] },
    { caption: 'Minha dragoa',     rotate: 1,  x:   '0%', delay: 0.5, scale: 1,    src: '/photo2.jpg', fb: ['/polaroid2.svg'] },
    { caption: 'Para sempre',      rotate: 6,  x:  '38%', delay: 0.9, scale: 0.85, src: '/photo3.jpg', fb: ['/polaroid3.svg'] },
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
            position: 'relative',
          }}>
            {/* fita dourada */}
            <div style={{
              position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotate(-3deg)',
              width: 72, height: 20,
              background: 'linear-gradient(90deg, rgba(201,168,76,0.55), rgba(240,208,128,0.65), rgba(201,168,76,0.55))',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              zIndex: 6,
            }} />
            {/* Revelação fotográfica */}
            <div style={{ width: 192, height: 192, overflow: 'hidden', position: 'relative', background: '#e9e4dc' }}>
              <motion.div
                initial={{ y: '0%' }}
                animate={{ y: '-101%' }}
                transition={{ delay: item.delay + 0.6, duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
                style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #fff 85%, #f0ece4)', zIndex: 2 }}
              />
              <motion.img
                src={item.src}
                alt="Helena"
                initial={{ filter: 'sepia(0.5) brightness(1.7) contrast(0.7) blur(6px)' }}
                animate={{ filter: 'sepia(0) brightness(1) contrast(1) blur(0px)' }}
                transition={{ delay: item.delay + 1.1, duration: 1.6, ease: 'easeOut' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={chainFallback(item.fb)}
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
          position: 'absolute', bottom: '8%',
          fontSize: 10, letterSpacing: '0.4em', color: '#6b5c60',
          fontFamily: 'Inter', fontWeight: 300, textTransform: 'uppercase', zIndex: 10
        }}
      >
        preparando a playlist...
      </motion.p>
    </motion.div>
  );
}

/* ─── PHASE 4: PLAYER TOTALMENTE CUSTOM ──────────────────── */
function PhasePlayer({ player }) {
  const { ready, trackIndex, playing, playTrack, toggle, next, prev } = player;
  const [lyrics, setLyrics] = useState(false);
  const [activeLyric, setActiveLyric] = useState(0);
  const [burst, setBurst] = useState(0);
  const [fallback, setFallback] = useState(false);

  const useFallback = fallback && !ready;

  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setFallback(true), 8000);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (!lyrics) return;
    const el = document.getElementById('lyrics-root');
    if (!el) return;
    const fn = () => setActiveLyric(Math.min(Math.floor(el.scrollTop / 140), LYRICS.length - 1));
    el.addEventListener('scroll', fn);
    return () => el.removeEventListener('scroll', fn);
  }, [lyrics]);

  const handlePlay = () => {
    toggle();
    if (!playing) setBurst(b => b + 1);
  };

  return (
    <motion.div
      style={{ minHeight: '100vh', paddingBottom: 120 }}
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
        {/* Capa 3D flutuante com reflexo */}
        <motion.div
          initial={{ opacity: 0, rotateY: -20, y: 30 }}
          animate={{ opacity: 1, rotateY: 0, y: 0 }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ flexShrink: 0, perspective: 800, position: 'relative' }}
        >
          <motion.div
            animate={{ rotateY: [0, 4, 0, -4, 0], y: [0, -6, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 'clamp(160px,22vw,220px)', aspectRatio: '1', transformStyle: 'preserve-3d', position: 'relative' }}
          >
            <img
              src="/collage.jpg"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, display: 'block', boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 50px rgba(201,65,90,0.15)' }}
              onError={chainFallback(COVER_FALLBACKS)}
            />
            {/* reflexo real da capa */}
            <img
              src="/collage.jpg"
              alt=""
              aria-hidden
              style={{
                position: 'absolute', top: '101%', left: 0, width: '100%', height: '60%',
                objectFit: 'cover', objectPosition: 'bottom', borderRadius: 4,
                transform: 'scaleY(-1)',
                opacity: 0.28, filter: 'blur(2px)',
                WebkitMaskImage: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.8))',
                maskImage: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.8))',
                pointerEvents: 'none',
              }}
              onError={chainFallback(COVER_FALLBACKS)}
            />
          </motion.div>
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
            Para a Minha<br />Dragoa
          </h1>
          <p style={{ fontSize: 13, fontWeight: 300, color: '#8a7070', lineHeight: 1.8, maxWidth: 460, marginBottom: 14 }}>
            As músicas que embalam o nosso amor.<br />Para você, Helena Narloch, no Dia dos Namorados.
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
      <div style={{ padding: '0 clamp(24px,6vw,80px) 16px', display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 10, flexWrap: 'wrap' }}>
        <button onClick={prev} className="btn-icon" aria-label="anterior">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM9.5 12l8.5 6V6z"/></svg>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={handlePlay}
            aria-label={playing ? 'pausar' : 'tocar'}
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
          <HeartBurst trigger={burst} />
        </div>

        <button onClick={next} className="btn-icon" aria-label="próxima">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>
        </button>

        <Visualizer playing={playing} />

        {!ready && !useFallback && (
          <span style={{ fontSize: 10, letterSpacing: '0.3em', color: '#6b5c60', fontFamily: 'Inter', textTransform: 'uppercase' }}>
            afinando os corações...
          </span>
        )}

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

      {/* ── TRACKLIST CUSTOM ── */}
      <div style={{ padding: '8px clamp(24px,6vw,80px)', position: 'relative', zIndex: 10 }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10, marginBottom: 4, fontSize: 10, letterSpacing: '0.3em', color: '#4a3040', textTransform: 'uppercase', fontFamily: 'Inter' }}>
          Faixas
        </div>

        {!useFallback ? TRACKS.map((track, i) => {
          const active = i === trackIndex;
          return (
            <motion.div
              key={track.id}
              className="track-row"
              onClick={() => playTrack(i)}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: '16px 12px', cursor: 'pointer',
              }}
            >
              <span style={{
                width: 26, textAlign: 'center', flexShrink: 0,
                fontFamily: 'Cormorant Garamond', fontStyle: 'italic', fontSize: 18,
                color: active ? '#c9a84c' : '#4a3040',
              }}>
                {active && playing ? (
                  <span className="eq" style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
                    <span style={{ animationDelay: '0s' }} />
                    <span style={{ animationDelay: '0.25s' }} />
                    <span style={{ animationDelay: '0.5s' }} />
                  </span>
                ) : (
                  i + 1
                )}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Cormorant Garamond', fontSize: 20, fontWeight: 400,
                  color: active ? '#c9415a' : '#e8ddd8',
                  transition: 'color 0.3s',
                }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 11, color: '#6b5c60', fontFamily: 'Inter', fontWeight: 300, letterSpacing: '0.08em' }}>
                  {track.artist}
                </div>
              </div>
              <span className="track-heart" style={{ marginLeft: 'auto', color: active ? '#c9415a' : '#3a2030', fontSize: 15, transition: 'color 0.3s, opacity 0.3s' }}>
                ♡
              </span>
            </motion.div>
          );
        }) : (
          /* fallback gracioso: embeds clássicos se a API não carregar */
          TRACKS.map((track) => (
            <div key={track.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' }}>
              <iframe
                title={track.title}
                src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`}
                width="100%" height="80" frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ display: 'block', background: 'transparent', borderRadius: 4 }}
              />
            </div>
          ))
        )}

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
            <div style={{ padding: '42vh max(8vw, 32px) 60vh' }}>
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
  const player = useSpotifyPlayer();
  const { trackIndex, playing, position, duration, toggle, next, prev, seek, begin } = player;

  useEffect(() => {
    if (phase === 1) { const t = setTimeout(() => setPhase(2), 6800); return () => clearTimeout(t); }
    if (phase === 2) { const t = setTimeout(() => setPhase(3), 4000); return () => clearTimeout(t); }
    if (phase === 3) { const t = setTimeout(() => { setPhase(4); window.scrollTo(0, 0); }, 5800); return () => clearTimeout(t); }
  }, [phase]);

  const openEnvelope = () => {
    setPhase(1);
    begin(); // a música começa junto com a surpresa
  };

  const onSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek((e.clientX - rect.left) / rect.width);
  };

  const track = TRACKS[trackIndex];

  return (
    <div style={{ minHeight: '100vh', background: '#060206', color: '#e8ddd8', position: 'relative', overflow: 'hidden' }}>
      <FilmGrain />

      {/* Player Spotify escondido (controlado pela nossa UI) */}
      <div
        id="spotify-wrapper"
        style={{ position: 'fixed', left: -9999, bottom: 0, width: 320, height: 80, opacity: 0, pointerEvents: 'none' }}
      />

      <AnimatePresence>
        {phase === -1 && <PhaseCinema key="cinema" onEnd={() => setPhase(0)} />}
        {phase === 0  && <PhaseEnvelope key="env" onOpen={openEnvelope} />}
        {phase === 1  && <PhaseUniverse key="universe" />}
        {phase === 2  && <PhaseInvitation key="inv" />}
        {phase === 3  && <PhaseGallery key="gal" />}
        {phase === 4  && <PhasePlayer key="player" player={player} />}
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
              display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px',
              zIndex: 100,
            }}
          >
            <img
              src="/collage.jpg"
              alt=""
              style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }}
              onError={chainFallback(COVER_FALLBACKS)}
            />
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', minWidth: 100, maxWidth: 150 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#e8ddd8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</span>
              <span style={{ fontSize: 11, color: '#6b5c60', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist}</span>
            </div>

            <button onClick={prev} className="btn-icon" aria-label="anterior" style={{ flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM9.5 12l8.5 6V6z"/></svg>
            </button>
            <button
              onClick={toggle}
              aria-label={playing ? 'pausar' : 'tocar'}
              style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0, background: 'linear-gradient(135deg, #c9415a, #7a1230)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(201,65,90,0.35)' }}
            >
              {playing
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}><polygon points="5,3 19,12 5,21"/></svg>
              }
            </button>
            <button onClick={next} className="btn-icon" aria-label="próxima" style={{ flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>
            </button>

            <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ fontSize: 10, color: '#6b5c60', flexShrink: 0 }}>{fmt(position)}</span>
              <div onClick={onSeek} className="progress-bar-container" style={{ flex: 1, minWidth: 0 }}>
                <div className="progress-bar-fill" style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }} />
              </div>
              <span style={{ fontSize: 10, color: '#6b5c60', flexShrink: 0 }}>{fmt(duration)}</span>
            </div>

            <div className="hide-mobile">
              <Visualizer playing={playing} bars={14} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
