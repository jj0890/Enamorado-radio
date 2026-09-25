import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminLoginProps {
  /** Called with the entered password */
  onLogin?: (password: string) => void;
  /** Alias — called with no args after login (magazine-admin pages use this) */
  onLoginSuccess?: () => void;
}

export default function AdminLogin({ onLogin, onLoginSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin?.(password);
    onLoginSuccess?.();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow p-8 max-w-sm w-full">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
