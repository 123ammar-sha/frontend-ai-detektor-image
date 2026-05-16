"use client";

import { useState, useRef, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────
interface DetectionResult {
  status: string;
  akurasi_prediksi: string;
  dimensi_input: string;
  skor_mentah: number;
  skor_ai?: number;
  skor_real?: number;
  metadata_kamera?: boolean;
  catatan?: string;
  model_version?: string;
}

// ── Process Step Component ───────────────────────────────────
function ProcessStep({
  step, label, sublabel, active, done, last,
}: {
  step: number; label: string; sublabel: string;
  active: boolean; done: boolean; last?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${
            done
              ? "bg-emerald-500 border-emerald-500 text-white scale-105"
              : active
              ? "bg-cyan-500 border-cyan-500 text-white animate-pulse"
              : "bg-[#0d1117] border-[#30363d] text-[#484f58]"
          }`}
        >
          {done ? "✓" : step}
        </div>
        {!last && (
          <div
            className={`w-0.5 h-10 mt-1 transition-all duration-700 ${
              done ? "bg-emerald-500" : "bg-[#21262d]"
            }`}
          />
        )}
      </div>
      <div className="pt-1.5">
        <p
          className={`text-sm font-semibold transition-colors duration-300 ${
            done ? "text-emerald-400" : active ? "text-cyan-300" : "text-[#484f58]"
          }`}
        >
          {label}
        </p>
        <p className="text-xs text-[#484f58] mt-0.5">{sublabel}</p>
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
      // Draw original
      const origCanvas = originalRef.current!;
      origCanvas.width  = SIZE;
      origCanvas.height = SIZE;
      const octx = origCanvas.getContext("2d")!;
      octx.drawImage(img, 0, 0, SIZE, SIZE);

      // Simulate ELA: re-compress to lower quality and diff
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width  = SIZE;
      tempCanvas.height = SIZE;
      const tctx = tempCanvas.getContext("2d")!;
      tctx.drawImage(img, 0, 0, SIZE, SIZE);

      const tempImg = new Image();
      tempImg.onload = () => {
        tctx.drawImage(tempImg, 0, 0, SIZE, SIZE);
        const origData  = octx.getImageData(0, 0, SIZE, SIZE);
        const compData  = tctx.getImageData(0, 0, SIZE, SIZE);

        const elaCanvas = elaRef.current!;
        elaCanvas.width  = SIZE;
        elaCanvas.height = SIZE;
        const ectx = elaCanvas.getContext("2d")!;
        const elaData = ectx.createImageData(SIZE, SIZE);

        for (let i = 0; i < origData.data.length; i += 4) {
          const amplify = 15;
          elaData.data[i]   = Math.min(255, Math.abs(origData.data[i]   - compData.data[i])   * amplify);
          elaData.data[i+1] = Math.min(255, Math.abs(origData.data[i+1] - compData.data[i+1]) * amplify);
          elaData.data[i+2] = Math.min(255, Math.abs(origData.data[i+2] - compData.data[i+2]) * amplify);
          elaData.data[i+3] = 255;
        }
        ectx.putImageData(elaData, 0, 0);
        setReady(true);
      };
      // Re-draw at lower quality via JPEG round-trip
      tempImg.src = tempCanvas.toDataURL("image/jpeg", 0.5);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [imageFile]);

  if (!imageFile) return null;

  return (
    <div className="mt-6 rounded-xl border border-[#21262d] overflow-hidden">
      <div className="bg-[#161b22] px-4 py-2.5 border-b border-[#21262d] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-xs font-mono text-[#8b949e]">Error Level Analysis — Visualisasi ELA</span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[#8b949e] mb-2 font-mono">INPUT ASLI</p>
          <canvas
            ref={originalRef}
            className="w-full rounded-lg border border-[#30363d]"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
        <div>
          <p className="text-xs text-cyan-400 mb-2 font-mono">ELA MAP {ready ? "✓" : "..."}</p>
          <canvas
            ref={elaRef}
            className={`w-full rounded-lg border border-[#30363d] transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>
      <div className="px-4 pb-3">
        <p className="text-xs text-[#484f58] leading-relaxed">
          <span className="text-cyan-400 font-semibold">ELA</span> mengungkap artefak kompresi tersembunyi.
          Foto kamera asli menampilkan noise acak dan merata, sedangkan gambar AI menunjukkan pola kotak
          seragam yang khas dari proses generatif matematis.
        </p>
      </div>
    </div>
  );
}

// ── Score Bar ────────────────────────────────────────────────
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#8b949e]">{label}</span>
        <span className="font-mono font-bold text-white">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function Home() {
  const [file,     setFile]     = useState<File | null>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<DetectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step,     setStep]     = useState(0); // 0=idle 1=upload 2=ela 3=model 4=done
  const dropRef = useRef<HTMLDivElement>(null);

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
      // Simulate ELA step timing
      await new Promise(r => setTimeout(r, 800));
      setStep(3);

      const response = await fetch(
        "https://ammarshafiy123-api-ai-detektor.hf.space/api/detect",
        { method: "POST", body: formData }
      );
      const data = await response.json();

      setStep(4);
      await new Promise(r => setTimeout(r, 400));

      if (data.error) {
        setErrorMsg(data.error);
        setStep(1);
      } else {
        setResult(data);
      }
    } catch {
      setErrorMsg("Gagal terhubung ke server. Pastikan backend aktif.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const isReal   = result?.status.includes("Asli");
  const scoreAI   = result?.skor_ai   ?? (result ? parseFloat(result.akurasi_prediksi) * (isReal ? 0 : 1) : 0);
  const scoreReal = result?.skor_real ?? (result ? parseFloat(result.akurasi_prediksi) * (isReal ? 1 : 0) : 0);

  return (
    <main
      className="min-h-screen text-white font-sans"
      style={{
        background: "radial-gradient(ellipse at 20% 50%, #0d1f2d 0%, #0d1117 60%)",
        fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      }}
    >
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#58a6ff 1px, transparent 1px), linear-gradient(90deg, #58a6ff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-full px-4 py-1.5 text-xs text-cyan-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            ELA + EfficientNetB0 · Akurasi 86.7%
          </div>
          <h1
            className="text-5xl font-black tracking-tight mb-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <span className="text-white">AI Image</span>{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #58a6ff, #38d9a9)" }}
            >
              Detector
            </span>
          </h1>
          <p className="text-[#8b949e] text-base max-w-xl mx-auto leading-relaxed">
            Sistem forensik digital berbasis{" "}
            <span className="text-cyan-400">Error Level Analysis</span> untuk
            membedakan foto kamera asli dari citra buatan AI generatif.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Upload + ELA ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload Zone */}
            <div
              ref={dropRef}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="relative rounded-xl border-2 border-dashed border-[#30363d] hover:border-cyan-500/50 transition-all duration-300 cursor-pointer overflow-hidden group"
              style={{ background: "linear-gradient(135deg, #161b22 0%, #0d1117 100%)" }}
            >
              <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-all duration-300" />
              <div className="relative p-8 text-center">
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-56 mx-auto rounded-lg shadow-2xl object-contain border border-[#30363d]"
                    />
                    <div className="mt-3 text-xs text-[#8b949e]">
                      {file?.name} · {((file?.size ?? 0) / 1024).toFixed(0)}KB
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#21262d] flex items-center justify-center text-3xl">
                      🔍
                    </div>
                    <p className="text-[#8b949e] text-sm">
                      Drag & drop gambar di sini, atau klik untuk memilih
                    </p>
                    <p className="text-[#484f58] text-xs mt-1">JPEG, PNG, WebP · Maks 10MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* ELA Visualization */}
            {file && <ELACanvas imageFile={file} />}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-300 relative overflow-hidden ${
                !file || loading
                  ? "bg-[#21262d] text-[#484f58] cursor-not-allowed"
                  : "text-white shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5"
              }`}
              style={
                file && !loading
                  ? { background: "linear-gradient(135deg, #1f6feb, #58a6ff)" }
                  : {}
              }
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menganalisis...
                </span>
              ) : (
                "🔬 Analisis Gambar"
              )}
            </button>

            {/* Error */}
            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Result */}
            {result && (
              <div
                className={`rounded-xl border overflow-hidden transition-all duration-500 ${
                  isReal
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <div
                  className={`px-5 py-4 border-b ${
                    isReal ? "border-emerald-500/20" : "border-red-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#8b949e] uppercase tracking-widest mb-1">
                        Hasil Deteksi
                      </p>
                      <p
                        className={`text-2xl font-black ${
                          isReal ? "text-emerald-400" : "text-red-400"
                        }`}
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {result.status}
                      </p>
                    </div>
                    <div
                      className={`text-5xl ${isReal ? "opacity-80" : "opacity-80"}`}
                    >
                      {isReal ? "📷" : "🤖"}
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Score bars */}
                  <ScoreBar
                    label="Probabilitas Foto Asli"
                    value={scoreReal}
                    color="bg-emerald-500"
                  />
                  <ScoreBar
                    label="Probabilitas Buatan AI"
                    value={scoreAI}
                    color="bg-red-500"
                  />

                  {/* Meta info */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d]">
                      <p className="text-xs text-[#484f58] mb-1">Dimensi Input</p>
                      <p className="font-mono text-sm text-white">{result.dimensi_input}</p>
                    </div>
                    <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d]">
                      <p className="text-xs text-[#484f58] mb-1">Metadata Kamera</p>
                      <p className="font-mono text-sm text-white">
                        {result.metadata_kamera ? "✅ Ditemukan" : "❌ Tidak ada"}
                      </p>
                    </div>
                    <div className="bg-[#0d1117] rounded-lg p-3 border border-[#21262d] col-span-2">
                      <p className="text-xs text-[#484f58] mb-1">Catatan Sistem</p>
                      <p className="font-mono text-xs text-cyan-400">
                        {result.catatan ?? "ELA + EfficientNetB0"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Process Steps + Info ── */}
          <div className="space-y-4">
            {/* Process Steps */}
            <div
              className="rounded-xl border border-[#21262d] p-5"
              style={{ background: "#161b22" }}
            >
              <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-5">
                Proses Deteksi
              </p>
              <div className="space-y-0">
                <ProcessStep
                  step={1} label="Upload Gambar"
                  sublabel="Validasi format & ukuran"
                  active={step === 1} done={step > 1}
                />
                <ProcessStep
                  step={2} label="Ekstraksi ELA"
                  sublabel="Re-compress & diff piksel"
                  active={step === 2} done={step > 2}
                />
                <ProcessStep
                  step={3} label="Inferensi Model"
                  sublabel="EfficientNetB0 forward pass"
                  active={step === 3} done={step > 3}
                />
                <ProcessStep
                  step={4} label="Hybrid Scoring"
                  sublabel="EXIF + probability smoothing"
                  active={step === 4} done={step > 4} last
                />
              </div>
            </div>

            {/* Architecture Info */}
            <div
              className="rounded-xl border border-[#21262d] p-5"
              style={{ background: "#161b22" }}
            >
              <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-4">
                Arsitektur Model
              </p>
              <div className="space-y-2">
                {[
                  { layer: "Input ELA Map",      shape: "224×224×3",  color: "bg-cyan-500" },
                  { layer: "EfficientNetB0",      shape: "7×7×1280",   color: "bg-blue-500" },
                  { layer: "GlobalAvgPool",       shape: "1280",       color: "bg-violet-500" },
                  { layer: "Dense + Dropout",     shape: "256 → 64",   color: "bg-purple-500" },
                  { layer: "Output Sigmoid",      shape: "1 (binary)", color: "bg-emerald-500" },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-1.5 h-8 rounded-full ${l.color} opacity-80`} />
                    <div>
                      <p className="text-xs text-white font-medium">{l.layer}</p>
                      <p className="text-xs text-[#484f58] font-mono">{l.shape}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div
              className="rounded-xl border border-[#21262d] p-5"
              style={{ background: "#161b22" }}
            >
              <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-4">
                Performa Model
              </p>
              <div className="space-y-3">
                {[
                  { label: "Val Accuracy",  value: "86.7%",   bar: 86.7, color: "bg-cyan-500" },
                  { label: "AUC-ROC",       value: "0.942",   bar: 94.2, color: "bg-blue-500" },
                  { label: "Dataset",       value: "120K",    bar: 100,  color: "bg-violet-500" },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#8b949e]">{s.label}</span>
                      <span className="font-mono text-white font-bold">{s.value}</span>
                    </div>
                    <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.color}`}
                        style={{ width: `${s.bar}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer note */}
            <p className="text-xs text-[#484f58] text-center leading-relaxed px-2">
              Dikembangkan untuk tugas mata kuliah{" "}
              <span className="text-[#8b949e]">Pengenalan Pola</span>
              <br />
              UMUKA · Semester 4 · 2025
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}