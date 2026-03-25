import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#data=")) {
        const b64 = hash.replace("#data=", "");
        const jsonStr = atob(b64);
        const user = JSON.parse(jsonStr);
        
        localStorage.setItem("user", JSON.stringify(user));
        toast.success("Successfully authenticated with Google!");
        
        // Handle checkout redirect if we know they wanted to checkout
        // For simplicity we just go to dashboard on oauth connect
        navigate("/dashboard");
      } else {
        throw new Error("No authentication data found in URL.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to parse authentication data.");
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium tracking-widest text-sm uppercase">Completing Sign In...</p>
      </div>
    </div>
  );
}
