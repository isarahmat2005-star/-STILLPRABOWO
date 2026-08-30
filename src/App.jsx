import React, { useState, useRef, useEffect } from 'react';

// Menghapus import './index.css' yang bermasalah di lingkungan ini.
// Tailwind akan di-load via class name atau CDN/Konfigurasi Vite kamu nantinya.

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const CANVAS_SIZE = 500;

  // Fungsi untuk menggambar state kosong di kanvas
  const drawEmptyState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set ukuran asli (internal resolusi)
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "24px 'Share Tech', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Area Hasil", canvas.width / 2, canvas.height / 2 - 15);
    ctx.font = "16px 'Share Tech', sans-serif";
    ctx.fillText("Upload foto di atas", canvas.width / 2, canvas.height / 2 + 15);
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Share+Tech&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Jalankan saat komponen pertama kali dirender
    drawEmptyState();
    Promise.all([
      document.fonts.load("24px 'Share Tech'"),
      document.fonts.load("16px 'Share Tech'")
    ]).then(() => {
      drawEmptyState();
    }).catch(() => {
    });
    
    // Listener untuk menerima balasan (postMessage) dari HTML Gateway
    const handleMessage = (event) => {
      const data = event.data;
      if (data && data.type === 'GEMINI_RESPONSE' && data.id === 'generate-stencil') {
        if (data.success) {
          try {
             // Ekstrak data base64 dari response Gemini
             const outBase64 = data.data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
             if (!outBase64) throw new Error("Tidak ada gambar yang dihasilkan oleh AI.");
             
             const resultBase64Data = `data:image/jpeg;base64,${outBase64}`;
             
             // Gambar ke kanvas
             const img = new Image();
             img.onload = () => {
                 const canvas = canvasRef.current;
                 const ctx = canvas.getContext('2d');
                 const size = Math.min(img.width, img.height);
                 const startX = (img.width - size) / 2;
                 const startY = (img.height - size) / 2;

                 ctx.fillStyle = "white";
                 ctx.fillRect(0, 0, canvas.width, canvas.height);
                 ctx.drawImage(img, startX, startY, size, size, 0, 0, canvas.width, canvas.height);
                 
                 setResultImage(canvas.toDataURL('image/png'));
                 setIsProcessing(false);
             };
             img.src = resultBase64Data;

          } catch (err) {
            console.error("Gagal parsing hasil:", err);
            setErrorMsg("Gagal memproses hasil dari AI.");
            setIsProcessing(false);
          }
        } else {
          console.error("API Error:", data.error);
          setErrorMsg(data.error || "Terjadi kesalahan pada AI.");
          setIsProcessing(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setResultImage(null);
    setErrorMsg(null);
    drawEmptyState(); // Bersihkan kanvas lama

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      const mimeType = file.type || 'image/jpeg';
      const base64String = base64Data.split(',')[1];
      
      // Susun payload untuk Gemini
      const payload = {
        contents: [{
            parts: [
                { text: "Convert this photo into a high contrast black and white stencil art style. Make it solid black and white only, no gray tones." },
                { inlineData: { mimeType: mimeType, data: base64String } }
            ]
        }],
        generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
        }
      };

      // Kirim request ke parent (HTML Gateway di Canvas)
      window.parent.postMessage({
        type: 'CALL_GEMINI',
        id: 'generate-stencil',
        // Menggunakan endpoint path sesuai setup Gateway baru
        endpointPath: 'gemini-3.1-flash-image:generateContent',
        payload: payload
      }, '*');
    };
    
    reader.readAsDataURL(file);
    // Reset nilai input file agar file yang sama bisa di-upload ulang
    if(fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.download = 'STILLPRABOWO-Avatar.png';
    link.href = resultImage;
    link.click();
  };

  return (
    <div className="min-h-screen font-['Share_Tech'] bg-white bg-[linear-gradient(to_right,rgba(220,38,38,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(220,38,38,0.15)_1px,transparent_1px)] bg-[size:30px_30px] antialiased">
      <div className="flex items-center justify-center py-10 px-4 min-h-screen">
        
        {/* Main Card */}
        <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border-2 border-red-600 relative z-10">
          
          {/* Header Section */}
          <div className="bg-red-600 text-white text-center py-6 px-4 relative overflow-hidden">
            <div className="flex justify-center mb-3 relative z-10">
              <img 
                src="https://ik.imagekit.io/oteii8rqh0/IMG_20260830_121543.webp" 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-wider relative z-10">#STILLPRABOWO</h1>
            
            {/* Dekorasi latar header */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-500 rounded-full opacity-50 blur-xl"></div>
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-700 rounded-full opacity-50 blur-xl"></div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            
            {/* Upload Area */}
            <div className="mb-6">
              <label 
                htmlFor="imageUpload" 
                className={`block w-full cursor-pointer bg-red-50 hover:bg-red-100 border-2 border-dashed ${errorMsg ? 'border-red-600' : 'border-red-400'} text-red-700 text-center py-8 px-4 rounded-xl transition duration-300`}
              >
                <svg className="mx-auto h-12 w-12 mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                <span className="text-lg font-bold block">
                  {errorMsg ? "Gagal memproses. Coba foto lain." : "Upload foto anda Untuk menjadi bagian #stillprabowo"}
                </span>
                <input 
                  type="file" 
                  id="imageUpload" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </label>
            </div>

            {/* Editor/Preview Area */}
            <div className="flex flex-col items-center">
              <div className="relative w-64 h-64 mb-6 rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner bg-gray-50">
                
                {/* Loading Indicator Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 backdrop-blur-sm">
                    <span className="text-red-600 font-bold animate-pulse text-center px-2 text-lg">Memproses...</span>
                  </div>
                )}
                
                {/* Canvas (selalu ada) */}
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Download Button */}
              <button 
                onClick={handleDownload}
                disabled={!resultImage || isProcessing} 
                className={`w-full font-bold py-3 px-4 rounded-xl transition duration-300 shadow-md flex justify-center items-center gap-2 ${
                  resultImage && !isProcessing 
                    ? "bg-red-600 hover:bg-red-700 text-white cursor-pointer" 
                    : "bg-gray-400 text-gray-100 cursor-not-allowed"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download Hasil
              </button>
            </div>
          </div>

          {/* Footer / Support Section */}
          <div className="bg-gray-50 p-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm mb-3 font-bold">Dukung Program KUALI MERAH PUTIH Untuk Membantu Saudara Kita Yang Membutuhkan</p>
            <a 
              href="https://saweria.co/bobonsantoso" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block w-full bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 font-bold py-3 px-4 rounded-xl transition duration-300 shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
              </svg>
              Support Bobon Santoso
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
