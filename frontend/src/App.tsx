import { useState } from 'react'

function App() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyber-darker via-cyber-dark to-black text-white flex items-center justify-center relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Content */}
      <div className="text-center z-10 px-4">
        <h1 
          className="text-7xl md:text-8xl font-bold mb-4 animate-glow-pulse"
          style={{
            color: '#00f0ff',
            textShadow: '0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.3)',
          }}
        >
          OneChain Colosseum
        </h1>
        
        <p className="text-2xl md:text-3xl text-gray-300 mb-2 font-light tracking-wide">
          The Ultimate Trading Arena
        </p>
        
        <p className="text-sm text-gray-500 mb-12">
          Compete. Trade. Conquer.
        </p>

        <button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative px-12 py-5 text-xl font-bold rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105"
          style={{
            background: isHovered 
              ? 'linear-gradient(135deg, #00f0ff 0%, #ff00ff 100%)'
              : 'linear-gradient(135deg, #00f0ff 0%, #0099cc 100%)',
            boxShadow: isHovered
              ? '0 0 30px rgba(255, 0, 255, 0.6), 0 0 60px rgba(0, 240, 255, 0.4)'
              : '0 0 20px rgba(0, 240, 255, 0.5)',
          }}
        >
          <span className="relative z-10 text-black">
            Enter Arena
          </span>
          
          {/* Shine effect */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
              transform: 'translateX(-100%)',
              animation: 'shine 3s infinite',
            }}
          ></div>
        </button>

        {/* Stats preview */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {[
            { label: 'Active Duels', value: '0', color: '#00f0ff' },
            { label: 'Total Wagered', value: '0 OCT', color: '#00ff00' },
            { label: 'Champions', value: '0', color: '#ff00ff' },
          ].map((stat, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-lg backdrop-blur-md border transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(13, 13, 13, 0.7)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div 
                className="text-3xl font-bold mb-2"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shine {
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}

export default App
