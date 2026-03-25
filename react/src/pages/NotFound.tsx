import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const backgroundElements = (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 animate-[spin_20s_linear_infinite] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] opacity-30" />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-blue-400/30 rounded-full"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans text-white">
      {backgroundElements}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-12 text-center shadow-2xl relative z-10"
      >
        <div className="absolute top-0 right-0 p-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="w-24 h-24 bg-blue-500/20 border border-blue-500/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-blue-500/20 relative z-10">
          <Brain className="w-12 h-12 text-blue-400" />
        </div>
        
        <h1 className="text-6xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 relative z-10">
          404
        </h1>
        <h2 className="text-2xl font-bold text-white mb-4 relative z-10">Page Not Found</h2>
        
        <p className="text-gray-400 font-medium mb-10 relative z-10">
          The node you are trying to access does not exist in our neural network.
        </p>

        <a href="/" className="block relative z-10">
          <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/25 transition-all flex gap-2">
            <ArrowLeft className="w-5 h-5" /> Return to Hub
          </Button>
        </a>
      </motion.div>
    </div>
  );
};

export default NotFound;
