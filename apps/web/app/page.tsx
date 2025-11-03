'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Users, Award, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const words = [
    { text: 'Worker', bgColor: '#dde3e9', textColor: '#2952af' },
    { text: 'Employer', bgColor: '#eadae8', textColor: '#dd70b9' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInitial, setIsInitial] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Fix hydration mismatch by waiting for client mount
    setIsMounted(true);
    
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check authentication and redirect to feed
  const handleGoToFeed = () => {
    if (isAuthenticated) {
      router.push('/feed');
    } else {
      router.push('/signin');
    }
  };

  // Check authentication and redirect to appropriate dashboard
  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (user?.role === 'JOB_SEEKER') {
        router.push('/applicant/profile');
      } else if (user?.role === 'JOB_PROVIDER') {
        router.push('/employer/profile');
      }
    } else {
      router.push('/signup');
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <button 
          onClick={() => router.push('/')}
          className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
        >
          Hunaroo India
        </button>
        <div className="flex items-center gap-4">
          {!isMounted ? (
            <>
              <button 
                className="text-gray-700 px-6 py-2 rounded-full hover:bg-gray-100 transition-all"
              >
                Sign In
              </button>
              <button 
                className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all hover:scale-105 shadow-lg"
              >
                Get Started
              </button>
            </>
          ) : isAuthenticated ? (
            <>
              <button 
                onClick={handleGoToFeed}
                className="text-gray-700 px-6 py-2 rounded-full hover:bg-gray-100 transition-all"
              >
                Browse Jobs
              </button>
              <button 
                onClick={handleGetStarted}
                className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all hover:scale-105 shadow-lg"
              >
                Dashboard
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => router.push('/signin')}
                className="text-gray-700 px-6 py-2 rounded-full hover:bg-gray-100 transition-all"
              >
                Sign In
              </button>
              <button 
                onClick={() => router.push('/signup')}
                className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all hover:scale-105 shadow-lg"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section - Centered */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-6xl w-full">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full px-6 py-3 shadow-sm hover:shadow-md transition-shadow">
              <span className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-full">
                Live Now 🚀
              </span>
              <span className="text-gray-700">
                Connect skilled workers with opportunities{" "}
                <span className="font-semibold underline decoration-2 decoration-blue-400">
                  across India
                </span>
              </span>
              <span className="text-gray-400">›</span>
            </div>
          </div>

          {/* Main Headline with Animated Word */}
          <div className="text-center space-y-6 animate-slide-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Connecting Skills to Opportunities
              <br />
              for Every{" "}
              <span className="relative inline-block align-middle" style={{ width: '220px', minWidth: '220px' }}>
                {/* Animated Background - Fixed Size */}
                <span 
                  className="absolute inset-0 rounded-[2.5rem] transition-all duration-700 ease-in-out"
                  style={{
                    backgroundColor: words[currentIndex]?.bgColor || '#dde3e9',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                ></span>

                {/* Animated Text - Fixed Container */}
                <span className="relative z-10 flex items-center justify-center h-full px-8 py-2 overflow-hidden rounded-[2.5rem]">
                  <span 
                    key={currentIndex}
                    className={`font-bold transition-colors duration-700 ease-in-out ${isInitial ? '' : 'animate-word-slide'}`}
                    style={{
                      color: words[currentIndex]?.textColor || '#2952af'
                    }}
                  >
                    {words[currentIndex]?.text || 'Worker'}
                  </span>
                </span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              India&apos;s premier platform for skilled workers and employers.
              <br />
              From carpentry to driving, find the right talent or the perfect job.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button 
                onClick={handleGetStarted}
                className="group bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-all hover:scale-105 shadow-lg flex items-center gap-2 font-semibold"
              >
                <Briefcase className="w-5 h-5" />
                {isMounted && isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              </button>
              <button 
                onClick={handleGoToFeed}
                className="bg-white text-gray-900 px-8 py-3 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all hover:scale-105 shadow-sm font-semibold"
              >
                {isMounted && isAuthenticated ? 'Browse Jobs' : 'View Jobs'}
              </button>
            </div>
          </div>

          {/* Feature Cards - Compact & Clickable */}
          <div className="grid md:grid-cols-4 gap-6 mt-12 max-w-5xl mx-auto">
            <button 
              onClick={handleGoToFeed}
              className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all text-left"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                20+ Skills
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Wide range of opportunities
              </p>
            </button>

            <button 
              onClick={handleGetStarted}
              className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all text-left"
            >
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Verified Profiles
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Certified skill validation
              </p>
            </button>

            <button 
              onClick={handleGoToFeed}
              className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all text-left"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Apply
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                One-click job applications
              </p>
            </button>

            <button 
              onClick={handleGoToFeed}
              className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all text-left"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Smart Matching
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Filter by skills & location
              </p>
            </button>
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