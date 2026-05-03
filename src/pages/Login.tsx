import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import { Eye, EyeOff } from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
     const token = localStorage.getItem("token");
     if (token) navigate("/dashboard");
  }, [navigate]);

  const handleLogin = async () => {
  setError("");

  if (!email.trim()) {
    setError("Please enter your email");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError("Please enter a valid email address");
    return;
  }
  if (!password.trim()) {
    setError("Please enter your password");
    return;
  }
  if (password.length < 4) {
    setError("Password must be at least 4 characters");
    return;
  }

  setLoading(true);
  
  try {

   const response = await fetch(`${API_BASE}/auth/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
  email: email.trim().toLowerCase(),
  password: password.trim(),
}),
});

    const data = await response.json();


    if (!response.ok) {
      setError(data.detail || data.message || "Login failed");
      setLoading(false);
      return;
    }

 localStorage.setItem("token", data.token || data.access_token);
 if (data.role) localStorage.setItem("role", data.role);
 if (data.name) localStorage.setItem("name", data.name);

 // Save email from input directly — don't rely on API returning it
 localStorage.setItem("email", data.email || email.trim().toLowerCase());
 if (data.org) localStorage.setItem("org", data.org);

setError("");
navigate("/dashboard");

  } catch {
  setError("Server connection error");
} finally {
  setLoading(false);  
}
  };

  return (
   <div className="min-h-[100dvh] bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md mx-auto p-6 sm:p-8 my-6 rounded-2xl shadow-md">

        {/* ICON */}
        <div className="flex justify-center mb-5">
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm">
            <svg
              width="50"
              height="50"
              viewBox="0 0 100 100"
              fill="none"
              className="text-gray-800"
            >
              <circle cx="50" cy="38" r="18" fill="currentColor" />
              <path d="M25 80C25 65 75 65 75 80V85H25V80Z" fill="currentColor" />
              <line x1="25" y1="50" x2="75" y2="50"
                stroke="currentColor" strokeWidth="3" />
              <path d="M10 25V10H25" stroke="currentColor" strokeWidth="4" />
              <path d="M75 10H90V25" stroke="currentColor" strokeWidth="4" />
              <path d="M10 75V90H25" stroke="currentColor" strokeWidth="4" />
              <path d="M75 90H90V75" stroke="currentColor" strokeWidth="4" />
            </svg>
          </div>
        </div>

        {/* TITLE */}
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          SmartPresence
        </h2>

        <p className="text-sm text-gray-500 text-center mb-6">
          AI Powered Attendance System
        </p>

        {/* EMAIL */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => { setEmail(e.target.value.trim()); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* PASSWORD */}
        {/* PASSWORD */}
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-600 mb-1">
    Password
  </label>
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      placeholder="Enter your password"
      value={password}
      onChange={(e) => { setPassword(e.target.value.trim()); setError(""); }}
      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>
</div>

        {/* ERROR MESSAGE */}
        {error && (
          <p className="text-red-500 text-sm mb-4">
            {error}
          </p>
        )}

        {/* LOGIN BUTTON */}
       <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
      </button>

      </div>
    </div>
  );
}

export default Login;