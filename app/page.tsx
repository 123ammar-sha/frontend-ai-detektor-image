"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    // Tambahan untuk memastikan file benar-benar terbaca oleh browser
    console.log("File yang dipilih:", selectedFile); 

    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setErrorMsg(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://ammarshafiy123-api-ai-detektor.hf.space/api/detect", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        setErrorMsg(data.error);
      } else {
        setResult(data);
      }
    } catch (error) {
      setErrorMsg("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">AI Image Detector</h1>
          <p className="text-gray-500 mt-2">Deteksi apakah sebuah gambar adalah hasil kamera asli atau buatan Generative AI.</p>
        </div>

        {/* Area Upload */}
        <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center hover:bg-blue-50 transition-colors bg-white">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
        </div>

        {/* Preview Gambar */}
        {preview && (
          <div className="mt-6 flex justify-center">
            <img src={preview} alt="Preview" className="max-h-64 rounded-lg shadow-md object-contain border border-gray-200" />
          </div>
        )}

        {/* Tombol Analisis */}
        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className={`w-full mt-6 py-3 rounded-lg font-bold text-white transition-all ${
            !file || loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30"
          }`}
        >
          {loading ? "Sedang Menganalisis..." : "Analisis Gambar"}
        </button>

        {/* Area Pesan Error */}
        {errorMsg && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Area Hasil Deteksi */}
        {result && (
          <div className={`mt-6 p-6 rounded-xl border ${result.status.includes("Asli") ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Hasil Analisis</h3>
            <p className={`text-2xl font-bold ${result.status.includes("Asli") ? "text-green-700" : "text-red-700"}`}>
              {result.status}
            </p>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 col-span-2">
                <p className="text-xs text-gray-500 mb-2">Tingkat Keyakinan Model</p>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all duration-1000 ${result.status.includes("Asli") ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: result.akurasi_prediksi }}
                  ></div>
                </div>
                <p className="text-right mt-1 font-mono font-bold text-gray-800">{result.akurasi_prediksi}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">Dimensi Input</p>
                <p className="font-mono font-bold text-gray-800">{result.dimensi_input}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
