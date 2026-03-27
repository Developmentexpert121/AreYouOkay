import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api-config";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("token");
        
        if (token) {
          const res = await fetch(`${API_BASE_URL}/users/exchange-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || "Token exchange failed");
          }
          
          const user = await res.json();
          localStorage.setItem("user", JSON.stringify(user));
          toast.success("Successfully authenticated with Google!");
          
          // Direct redirection to the correct landing page to avoid blank screen/double-nav issues
          const isAdmin = user.email === "developmentexpert121@gmail.com";
          const isSubscribed = user.subscription_status === "active";
          
          if (isAdmin) {
            window.location.href = "/admin";
          } else if (isSubscribed) {
            window.location.href = "/dashboard";
          } else {
            window.location.href = "/subscription";
          }
        } else {
          // Fallback to old hash behavior just in case
          const hash = window.location.hash;
          if (hash && hash.startsWith("#data=")) {
            const b64 = hash.replace("#data=", "");
            const jsonStr = atob(b64);
            const user = JSON.parse(jsonStr);
            localStorage.setItem("user", JSON.stringify(user));
            toast.success("Successfully authenticated with Google!");

            const isAdmin = user.email === "developmentexpert121@gmail.com";
            const isSubscribed = user.subscription_status === "active";

            if (isAdmin) {
              window.location.href = "/admin";
            } else if (isSubscribed) {
              window.location.href = "/dashboard";
            } else {
              window.location.href = "/subscription";
            }
          } else {
            throw new Error("No authentication data found in URL.");
          }
        }
      } catch (err: any) {
        console.error("Auth Callback Error:", err);
        toast.error(err.message || "Failed to complete authentication.");
        navigate("/login");
      }
    };

    handleCallback();
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
