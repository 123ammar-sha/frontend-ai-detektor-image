"use client";

import { useState, useRef, useEffect } from "react";

// ── Types (Disesuaikan dengan API v2.2) ──────────────────────
interface DetectionResult {
  status: string;
  akurasi_prediksi: string;
  dimensi_input: string;
  skor_mentah: number;
  skor_ai: number;
  skor_real: number;
  catatan?: string;
  model_version?: string;
}

// ── SVG Icons ────────────────────────────────────────────────
const IconCamera = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
);

const IconCpu = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);

const IconUpload = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconLayers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

// ── Process Step ─────────────────────────────────────────────
function ProcessStep({ icon, label, sublabel, active, done, last }: {
  step: number; icon: React.ReactNode; label: string; sublabel: string;
  active: boolean; done: boolean; last?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-500 ${
          done   ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                 : active ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                 : "bg-[#161b22] border-[#30363d] text-[#484f58]"
        }`}>
          {done ? <IconCheck /> : icon}
        </div>
        {!last && <div className={`w-px h-8 mt-1 transition-all duration-700 ${done ? "bg-emerald-500/40" : "bg-[#21262d]"}`} />}
      </div>
      <div className="pt-1 min-w-0">
        <p className={`text-xs font-semibold transition-colors duration-300 ${
          done ? "text-emerald-400" : active ? "text-cyan-300" : "text-[#484f58]"
        }`}>{label}</p>
        <p className="text-xs text-[#484f58] mt-0.5 leading-tight">{sublabel}</p>
      </div>
    </div>
  );
}

// ── ELA Canvas ───────────────────────────────────────────────
function ELACanvas({ imageFile }: { imageFile: File | null }) {
  const originalRef = useRef<HTMLCanvasElement>(null);
  const elaRef      = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!imageFile) { setReady(false); return; }
    const url = URL.createObjectURL(imageFile);
    const img = new Image();
    img.onload = () => {
      const SIZE = 224;
      const origCanvas = originalRef.current!;
      origCanvas.width = SIZE; origCanvas.height = SIZE;
      const octx = origCanvas.getContext("2d")!;
      octx.drawImage(img, 0, 0, SIZE, SIZE);

      const tmp = document.createElement("canvas");
      tmp.width = SIZE; tmp.height = SIZE;
      const tctx = tmp.getContext("2d")!;
      tctx.drawImage(img, 0, 0, SIZE, SIZE);

      const tmpImg = new Image();
      tmpImg.onload = () => {
        tctx.drawImage(tmpImg, 0, 0, SIZE, SIZE);
        const origData = octx.getImageData(0, 0, SIZE, SIZE);
        const compData = tctx.getImageData(0, 0, SIZE, SIZE);
        const elaCanvas = elaRef.current!;
        elaCanvas.width = SIZE; elaCanvas.height = SIZE;
        const ectx = elaCanvas.getContext("2d")!;
        const elaData = ectx.createImageData(SIZE, SIZE);
        for (let i = 0; i < origData.data.length; i += 4) {
          const amp = 15;
          elaData.data[i]   = Math.min(255, Math.abs(origData.data[i]   - compData.data[i])   * amp);
          elaData.data[i+1] = Math.min(255, Math.abs(origData.data[i+1] - compData.data[i+1]) * amp);
          elaData.data[i+2] = Math.min(255, Math.abs(origData.data[i+2] - compData.data[i+2]) * amp);
          elaData.data[i+3] = 255;
        }
        ectx.putImageData(elaData, 0, 0);
        setReady(true);
      };
      tmpImg.src = tmp.toDataURL("image/jpeg", 0.5);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [imageFile]);

  if (!imageFile) return null;

  return (
    <div className="rounded-xl border border-[#21262d] overflow-hidden">
      <div className="bg-[#161b22] px-4 py-2.5 border-b border-[#21262d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-[#8b949e]">Error Level Analysis</span>
        </div>
        <span className="text-xs text-[#484f58]">{ready ? "Selesai" : "Memproses..."}</span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-[#8b949e] mb-2 font-mono tracking-wide">GAMBAR ASLI</p>
          <canvas ref={originalRef} className="w-full rounded-lg border border-[#30363d]" style={{ imageRendering: "pixelated" }} />
        </div>
        <div>
          <p className="text-xs text-cyan-400 mb-2 font-mono tracking-wide">PETA ELA</p>
          <canvas ref={elaRef} className={`w-full rounded-lg border border-[#30363d] transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-20"}`} style={{ imageRendering: "pixelated" }} />
        </div>
      </div>
      <div className="px-4 pb-3 flex gap-4 text-xs text-[#484f58]">
        <span><span className="text-cyan-400">Foto asli:</span> noise acak &amp; merata</span>
        <span><span className="text-orange-400">Gambar AI:</span> pola kotak seragam</span>
      </div>
    </div>
  );
}

// ── Animated Score Bar ───────────────────────────────────────
function ScoreBar({ label, value, colorClass, textColor }: {
  label: string; value: number; colorClass: string; textColor: string;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 150);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-[#8b949e]">{label}</span>
        <span className={`text-sm font-bold font-mono ${textColor}`}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 bg-[#21262d] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function Home() {
  const [file,     setFile]     = useState<File | null>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<DetectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step,     setStep]     = useState(0);

  const processFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setErrorMsg(null);
    setStep(1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) processFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setStep(2);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await new Promise(r => setTimeout(r, 600));
      setStep(3);

      const res = await fetch(
        "https://ammarshafiy123-api-ai-detektor.hf.space/api/detect",
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (data.error) {
        setErrorMsg(data.error);
        setStep(1);
      } else {
        setStep(4);
        setResult(data);
      }
    } catch {
      setErrorMsg("Gagal terhubung ke server. Pastikan backend aktif.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // ── Inferensi Hasil Murni Berdasarkan Status dari API v2.2 ──
  const finalIsReal = result?.status.includes("Asli");
  const scoreAI     = result?.skor_ai   ?? 0;
  const scoreReal    = result?.skor_real ?? 0;
  const confidence   = finalIsReal ? scoreReal : scoreAI;

  return (
    <main
      className="min-h-screen text-white"
      style={{
        background: "radial-gradient(ellipse at 15% 40%, #0d1f2d 0%, #0d1117 55%)",
        fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      }}
    >
      {/* subtle grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]" style={{
        backgroundImage: "linear-gradient(#58a6ff 1px,transparent 1px),linear-gradient(90deg,#58a6ff 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-full px-4 py-1.5 text-xs text-cyan-400 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Murni ELA + EfficientNetB0 · Ver 2.2
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="text-white">AI Image</span>{" "}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg,#58a6ff,#38d9a9)" }}>
              Detector
            </span>
          </h1>
          <p className="text-[#8b949e] text-sm max-w-lg mx-auto leading-relaxed">
            Forensik digital murni berbasis jaringan saraf tiruan konvolusional untuk membedakan struktur kompresi citra asli dan manipulasi AI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Upload */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="relative rounded-xl border-2 border-dashed border-[#30363d] hover:border-cyan-500/50 transition-all duration-300 overflow-hidden group"
              style={{ background: "linear-gradient(135deg,#161b22 0%,#0d1117 100%)" }}
            >
              <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/[0.03] transition-all duration-300" />
              <div className="relative p-6 text-center">
                {preview ? (
                  <div>
                    <img src={preview} alt="Preview" className="max-h-52 mx-auto rounded-lg shadow-xl object-contain border border-[#30363d]" />
                    <p className="mt-2 text-xs text-[#484f58] font-mono">{file?.name} · {((file?.size ?? 0)/1024).toFixed(0)}KB</p>
                  </div>
                ) : (
                  <div className="py-6">
                    <div className="flex justify-center mb-3 text-[#484f58]"><IconUpload /></div>
                    <p className="text-[#8b949e] text-sm">Drag &amp; drop gambar, atau klik untuk memilih</p>
                    <p className="text-[#484f58] text-xs mt-1">JPEG, PNG, WebP · Maks 10MB</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            {/* ELA Visualization */}
            {file && <ELACanvas imageFile={file} />}

            {/* Button */}
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                !file || loading
                  ? "bg-[#21262d] text-[#484f58] cursor-not-allowed"
                  : "text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/20"
              }`}
              style={file && !loading ? { background: "linear-gradient(135deg,#1f6feb,#58a6ff)" } : {}}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mengekstrak Laten...
                </span>
              ) : "Analisis Kompresi"}
            </button>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center flex items-center justify-center gap-2">
                <IconInfo />
                {errorMsg}
              </div>
            )}

            {/* Result Panel */}
            {result && (
              <div className={`rounded-xl border overflow-hidden ${
                finalIsReal ? "border-emerald-500/30" : "border-red-500/30"
              }`} style={{ background: finalIsReal ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)" }}>

                {/* Header hasil */}
                <div className={`px-5 py-4 border-b flex items-center justify-between ${
                  finalIsReal ? "border-emerald-500/20" : "border-red-500/20"
                }`}>
                  <div>
                    <p className="text-xs text-[#8b949e] uppercase tracking-widest mb-1">Hasil Eksperimen Pure Model</p>
                    <p className={`text-xl font-black ${finalIsReal ? "text-emerald-400" : "text-red-400"}`}
                       style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {finalIsReal ? "Asli Kamera (Real)" : "Buatan AI (Generated)"}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    finalIsReal
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}>
                    {finalIsReal ? <IconCamera /> : <IconCpu />}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Confidence utama */}
                  <div className={`p-4 rounded-lg border ${
                    finalIsReal ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
                  }`}>
                    <p className="text-xs text-[#8b949e] mb-1">Tingkat Probabilitas Model</p>
                    <div className="flex items-end gap-2">
                      <span className={`text-3xl font-black font-mono ${finalIsReal ? "text-emerald-400" : "text-red-400"}`}>
                        {confidence.toFixed(1)}%
                      </span>
                      <span className="text-xs text-[#484f58] mb-1">
                        {finalIsReal ? "karakteristik spasial alami" : "karakteristik sintesis generator"}
                      </span>
                    </div>
                    {/* Main bar */}
                    <div className="mt-2 h-3 bg-[#21262d] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${finalIsReal ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Dual score bars */}
                  <div className="space-y-3">
                    <ScoreBar
                      label="Akurasi Citra Alami (Real Score)"
                      value={scoreReal}
                      colorClass="bg-emerald-500"
                      textColor="text-emerald-400"
                    />
                    <ScoreBar
                      label="Akurasi Citra Sintetis (AI Score)"
                      value={scoreAI}
                      colorClass="bg-red-500"
                      textColor="text-red-400"
                    />
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d]">
                      <p className="text-xs text-[#484f58] mb-1">Dimensi Input Tensor</p>
                      <p className="font-mono text-xs text-white">{result.dimensi_input}</p>
                    </div>
                    <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d]">
                      <p className="text-xs text-[#484f58] mb-1">Output Sigmoid (Raw Value)</p>
                      <p className="font-mono text-xs text-white">{result.skor_mentah?.toFixed(4)}</p>
                    </div>
                  </div>

                  {/* Catatan Pelacakan */}
                  {result.catatan && (
                    <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d] flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5 flex-shrink-0"><IconInfo /></span>
                      <p className="font-mono text-xs text-[#8b949e] leading-relaxed">{result.catatan}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT (Pipeline Deteksi Jurnal) ── */}
          <div className="space-y-4">

            {/* Process Steps */}
            <div className="rounded-xl border border-[#21262d] p-5" style={{ background: "#161b22" }}>
              <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-5">Alur Inferensi Sistem</p>
              <div className="space-y-0">
                <ProcessStep step={1} icon={<IconUpload />}  label="Struktur Konten" sublabel="Validasi tipe piksel array" active={step===1} done={step>1} />
                <ProcessStep step={2} icon={<IconSearch />}  label="Transformasi ELA" sublabel="Analisis peta deviasi matriks" active={step===2} done={step>2} />
                <ProcessStep step={3} icon={<IconLayers />}  label="Konvolusi Ekstraktor" sublabel="EfficientNetB0 feature maps" active={step===3} done={step>3} last />
              </div>
            </div>

            {/* Architecture Card */}
            <div className="rounded-xl border border-[#21262d] p-5" style={{ background: "#161b22" }}>
              <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-4">Arsitektur Jaringan</p>
              <div className="space-y-2.5">
                {[
                  { layer: "Input Layer (ELA Map)", shape: "224×224×3",  color: "bg-cyan-500" },
                  { layer: "EfficientNetB0 Backbone", shape: "7×7×1280",   color: "bg-blue-500" },
                  { layer: "GlobalAveragePooling2D", shape: "1280",       color: "bg-violet-500" },
                  { layer: "Dense Head Layer",       shape: "1 (Sigmoid)", color: "bg-emerald-500" },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full ${l.color} opacity-70 flex-shrink-0`} />
                    <div>
                      <p className="text-xs text-white">{l.layer}</p>
                      <p className="text-xs text-[#484f58] font-mono">{l.shape}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metric */}
            <div className="rounded-xl border border-[#21262d] p-5" style={{ background: "#161b22" }}>
              <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-4">Metrik Jurnal Valid</p>
              <div className="space-y-3">
                {[
                  { label: "Validasi Akurasi", value: "86.7%", bar: 86.7, color: "bg-cyan-500" },
                  { label: "Nilai Skor AUC-ROC", value: "0.942", bar: 94.2, color: "bg-blue-500" },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#8b949e]">{s.label}</span>
                      <span className="font-mono text-white font-bold">{s.value}</span>
                    </div>
                    <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.bar}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-[#484f58] text-center leading-relaxed">
              Ammar Shafiy | NIM: IF0224009 <br /> Informatics Student Union (HIMAFORTI) · 2026
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
