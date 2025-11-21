import { useNavigate } from "react-router-dom";
import { RiComputerLine, RiSmartphoneLine } from "react-icons/ri"; // Fallback icons
import "animate.css";

const MobileRestricted = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0f1419] relative overflow-hidden px-6">
      {/* ──────── BACKGROUND EFFECTS ──────── */}
      {/* Deep atmospheric glows */}
      {/* <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" /> */}
      {/* <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} /> */}
      
      {/* Grid Pattern Overlay (Optional subtle texture) */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

      <div className="relative z-10 max-w-lg w-full text-center">
        
        {/* ──────── 3D ILLUSTRATION ──────── */}
        <div className="mb-8 relative group cursor-default">
            {/* Glow behind the image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-cyan-500/30 rounded-full blur-3xl group-hover:bg-cyan-400/40 transition-colors duration-500" />
            
            {/* 3D Image with floating animation */}
            <img 
                src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Desktop%20Computer.png"
                alt="Desktop Only" 
                className="w-48 h-48 md:w-64 md:h-64 mx-auto object-contain drop-shadow-2xl"
                style={{ filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))" }}
                onError={(e) => {
                    // Fallback if image fails: Show a large icon instead
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                }}
            />

            {/* Fallback Icon (Hidden by default, shows on error) */}
            <div className="hidden w-48 h-48 md:w-64 md:h-64 mx-auto items-center justify-center bg-gray-800/50 rounded-full border-2 border-dashed border-gray-600">
                <RiComputerLine className="text-6xl text-gray-400" />
            </div>
        </div>

        {/* ──────── TEXT CONTENT ──────── */}
        <div className="space-y-6 animate__animated animate__fadeInUp animate__delay-1s">
            {/* <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                    Desktop
                </span> Required
            </h1> */}
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
                <p className="text-gray-300 text-lg leading-relaxed">
                    The Admin Portal is a workspace optimized for large screens. 
                    To ensure you don&apos;t miss any details while managing your novels, 
                    please switch to a <span className="text-blue-500 font-semibold">Laptop</span> or <span className="text-blue-500 font-semibold">Desktop</span>.
                </p>
            </div>
        </div>

        {/* ──────── ACTION BUTTON ──────── */}
        <div className="mt-10 animate__animated animate__fadeInUp animate__delay-2s">
            <button
                onClick={() => navigate('/login')}
                className="group relative px-8 py-3 rounded-full bg-transparent overflow-hidden transition-all duration-300"
            >
                {/* Button Gradient Border/Glow */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cyan-500 to-purple-600 opacity-20 group-hover:opacity-100 transition-opacity duration-300 blur-md" />
                <div className="absolute inset-[1px] bg-[#0f1419] rounded-full" />
                
                <span className="relative flex items-center gap-2 text-cyan-400 group-hover:text-white font-semibold transition-colors">
                    <RiSmartphoneLine className="text-xl" />
                    Back to Login
                </span>
            </button>
        </div>
      </div>

        {/* ──────── CSS FOR FLOAT ANIMATION ──────── */}
        {/* <style>{`
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
                100% { transform: translateY(0px); }
            }
        `}</style> */}
    </div>
  );
};

export default MobileRestricted;