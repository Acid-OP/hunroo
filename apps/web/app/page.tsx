'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const words = [
    { text: 'Organiser', bgColor: '#eadae8', textColor: '#dd70b9' },
    { text: 'Employee', bgColor: '#dde3e9', textColor: '#2952af' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInitial, setIsInitial] = useState(true);

  useEffect(() => {
    // Remove initial state after first render
    const initialTimer = setTimeout(() => {
      setIsInitial(false);
    }, 100);

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 5000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-gray-900">Ticketapp</div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#achievements" className="text-gray-600 hover:text-gray-900 transition-colors">
            Achievements
          </a>
          <a href="#work" className="text-gray-600 hover:text-gray-900 transition-colors">
            Our Work
          </a>
          <a href="#comparison" className="text-gray-600 hover:text-gray-900 transition-colors">
            Comparison
          </a>
          <a href="#faqs" className="text-gray-600 hover:text-gray-900 transition-colors">
            FAQs
          </a>
          <button className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all hover:scale-105">
            Plans and Pricing
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-8 pt-20 pb-32">
        {/* New Feature Badge */}
        <div className="flex justify-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full px-6 py-3 shadow-sm hover:shadow-md transition-shadow">
            <span className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-full">
              New 🎉
            </span>
            <span className="text-gray-700">
              Make your guests feel special with{" "}
              <span className="font-semibold underline decoration-2 decoration-teal-400">
                Guest Feature
              </span>
            </span>
            <span className="text-gray-400">›</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center space-y-6 animate-slide-up">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight">
            A ticket system
            <br />
            acting like an{" "}
            <span className="relative inline-block align-middle">
              {/* Animated Background - stays visible, only color changes */}
              <span 
                className="absolute inset-0 rounded-[3rem] transition-all duration-700 ease-in-out"
                style={{
                  backgroundColor: words[currentIndex]?.bgColor || '#eadae8',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
              ></span>

              {/* Text Container with Sliding Animation */}
              <span className="relative z-10 block px-10 py-3 overflow-hidden rounded-[3rem]">
                <span 
                  key={currentIndex}
                  className={`block font-bold transition-colors duration-700 ease-in-out ${isInitial ? '' : 'animate-word-slide'}`}
                  style={{
                    color: words[currentIndex]?.textColor || '#dd70b9'
                  }}
                >
                  {words[currentIndex]?.text || 'Organiser'}
                </span>
              </span>
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Not your average ticketing tool. Ticketapp is a hybrid control tower for
            <br />
            both your street sellers and digital wizards.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 pt-8">
            <button className="group bg-black text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-all hover:scale-105 shadow-lg flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Get an Invite
            </button>
            <button className="bg-white text-gray-900 px-8 py-4 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all hover:scale-105 shadow-sm flex items-center gap-3">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                alt="User"
                className="w-6 h-6 rounded-full"
              />
              Get an Invite
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Light speed booking
            </h3>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Access to Private Portal
            </h3>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Unlimited Ticket Requests
            </h3>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes word-slide {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          15% {
            transform: translateY(0);
            opacity: 1;
          }
          85% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .animate-word-slide {
          animation: word-slide 5s ease-in-out;
        }
      `}</style>
    </div>
  );
}