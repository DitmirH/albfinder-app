import { useState } from 'react'
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const success = onLogin(username, password)
    if (!success) {
      setError('Invalid username or password')
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className={`relative w-full max-w-sm animate-scale-in ${shaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent shadow-lg shadow-accent/20 mb-4">
            <span className="text-2xl font-bold text-white">AF</span>
          </div>
          <h1 className="text-2xl font-bold text-white">AlbFinder</h1>
          <p className="text-[#748091] mt-1.5 text-sm">UK Company Director Intelligence</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#181D27] border border-[#313B4D] rounded-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#C7CDD6] mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#748091]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#151922] border border-[#313B4D] rounded-control text-white placeholder-[#748091] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all text-sm"
                  placeholder="Enter username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#C7CDD6] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#748091]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-[#151922] border border-[#313B4D] rounded-control text-white placeholder-[#748091] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all text-sm"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#748091] hover:text-white transition-colors p-1 touch-target"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[#F87171] text-sm bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] rounded-control px-4 py-3 animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-control transition-all duration-150 shadow-lg shadow-accent/20 hover:shadow-accent/30 active:scale-[0.98] touch-target"
            >
              Sign In
            </button>
          </form>
        </div>

        <p className="text-center text-[#748091] text-xs mt-6">
          Albanian Company Directors in the UK
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}
