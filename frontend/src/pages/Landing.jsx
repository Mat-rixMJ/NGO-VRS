import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-x-hidden min-h-screen flex flex-col">
      {/* Keyframe Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
        }
        .animate-scale-in {
            animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
            animation: float 7s ease-in-out infinite;
            animation-delay: 2s;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
      `}} />

      {/* TopNavBar */}
      <nav className="bg-surface/90 backdrop-blur-md border-b border-outline-variant shadow-sm docked full-width top-0 sticky z-50 transition-all duration-300">
        <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto py-4">
          <div className="flex items-center gap-3">
            <img 
              alt="Naye Pankh Foundation Logo" 
              className="h-12 w-12 rounded-full object-cover" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLssL78yhtqOoSNJCxsGgQcIinfdP7o-h1P2N8vAiV3SFj106KYLiRWRz-QMr7lY4lcxxxWnCATx0lGdGmyGKTz4MdMOZqWNDQkRq6EN6mGT0NsSlGJxXTM1AtWmLedem6Ij-D5t2epkHgLxHD-BuWwGuosZdMAAiyxvmc8SuqQtKmGj6X93J2eKI_nshA-45kEVFfNmsLNQrRNds7qjrjxD0g4X0RhJNpr1oaKA2d6M-1ERbOGRCN1VZQg" 
            />
            <span className="font-headline-md text-headline-md font-bold text-primary hidden sm:block">Naye Pankh Foundation</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a className="text-primary border-b-2 border-primary font-bold pb-1 text-label-caps font-label-caps uppercase tracking-wider" href="#hero">Home</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-label-caps font-label-caps uppercase tracking-wider" href="#impact">About Us</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-label-caps font-label-caps uppercase tracking-wider" href="#gallery">Gallery</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-label-caps font-label-caps uppercase tracking-wider" href="#footer">Contact</a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link 
                  className="hidden sm:inline-flex px-4 py-2 text-primary border border-primary hover:bg-primary/5 rounded-lg font-label-caps text-label-caps transition-all items-center justify-center" 
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                >
                  Volunteer
                </Link>
                <Link 
                  className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps hover:bg-on-primary-container transition-all shadow-md hover:shadow-lg active:scale-95 duration-150 items-center justify-center" 
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link 
                  className="hidden sm:inline-flex px-4 py-2 text-primary border border-primary hover:bg-primary/5 rounded-lg font-label-caps text-label-caps transition-all items-center justify-center" 
                  to="/signup"
                >
                  Volunteer
                </Link>
                <Link 
                  className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps hover:bg-on-primary-container transition-all shadow-md hover:shadow-lg active:scale-95 duration-150 items-center justify-center" 
                  to="/login"
                >
                  Sign In
                </Link>
              </>
            )}
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-on-surface p-2 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface/95 border-b border-outline-variant px-gutter py-4 flex flex-col gap-4 animate-fade-in-up">
            <a className="text-primary font-bold text-label-caps font-label-caps uppercase tracking-wider" href="#hero" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-label-caps font-label-caps uppercase tracking-wider" href="#impact" onClick={() => setMobileMenuOpen(false)}>About Us</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-label-caps font-label-caps uppercase tracking-wider" href="#gallery" onClick={() => setMobileMenuOpen(false)}>Gallery</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-label-caps font-label-caps uppercase tracking-wider" href="#footer" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            
            <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant">
              {user ? (
                <>
                  <Link 
                    className="px-4 py-2 text-primary border border-primary hover:bg-primary/5 rounded-lg font-label-caps text-label-caps text-center transition-all" 
                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Volunteer
                  </Link>
                  <Link 
                    className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps hover:bg-on-primary-container text-center transition-all shadow-md active:scale-95" 
                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    className="px-4 py-2 text-primary border border-primary hover:bg-primary/5 rounded-lg font-label-caps text-label-caps text-center transition-all" 
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Volunteer
                  </Link>
                  <Link 
                    className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps hover:bg-on-primary-container text-center transition-all shadow-md active:scale-95" 
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* Hero Section */}
        <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0 animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-r from-foundation-dark/90 via-foundation-dark/70 to-foundation-dark/40 z-10"></div>
            <img 
              alt="Happy children and volunteers" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLvAIq2HWbyvAJIuj3Y3So4s9A7g0XJa2VE_oI9UIESrpRvkT5HOmn0wZMtWfugihLLxe84dnY7QH5_KCArZD6wrq7giHe6JG5sBfFIK5V0lB8BmUh_SyaLVTzpxfhNjwjVhiYS-tmcuAZacJQfZQKEGqsHrj1DLhuvaCIsZH1fm47k2zU51TrykXkHRpssoi48Yv_A4QHwz_MMBWjW0x6WmzAf_v_octjDX9yQYKsDI1GqPc_hCSsQS6g" 
            />
          </div>
          <div className="relative z-20 w-full px-gutter max-w-container-max mx-auto py-section-padding text-white">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6 animate-fade-in-up delay-100">
                <span className="material-symbols-outlined text-[16px] text-primary-fixed">verified</span>
                <span className="font-label-caps text-label-caps text-white tracking-widest uppercase">UP Government, 80G &amp; 12A Registered NGO</span>
              </div>
              <h1 className="font-display-lg text-display-lg mb-6 leading-tight animate-fade-in-up delay-200">
                It's that easy to bring a <span className="text-primary-fixed">Smile</span> on Their Faces
              </h1>
              <p className="font-body-lg text-body-lg mb-8 text-white/90 max-w-xl animate-fade-in-up delay-300">
                We don't ask for much, just help us with what you can - Be it Money, Skill or Your Time. Over <strong className="text-primary-fixed">200,000+ Lives Touched</strong> by India's Biggest Student-Led NGO.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-400">
                {user ? (
                  <Link 
                    className="px-8 py-4 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps hover:bg-primary-container transition-all shadow-lg hover:shadow-xl active:scale-95 duration-150 text-center flex items-center justify-center gap-2 group" 
                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  >
                    Go to Dashboard <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>
                ) : (
                  <>
                    <Link 
                      className="px-8 py-4 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps hover:bg-primary-container transition-all shadow-lg hover:shadow-xl active:scale-95 duration-150 text-center flex items-center justify-center gap-2 group" 
                      to="/signup"
                    >
                      Donate / Volunteer <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">favorite</span>
                    </Link>
                    <Link 
                      className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-label-caps text-label-caps hover:bg-white/10 transition-all text-center flex items-center justify-center gap-2 group" 
                      to="/login"
                    >
                      Sign In <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Wave Divider Bottom */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden z-20 translate-y-1">
            <svg className="w-full h-12 md:h-24 text-background fill-current" preserveAspectRatio="none" viewBox="0 0 1200 120">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,123.3,191.7,105.7,236.4,92.68,279.74,74.56,321.39,56.44Z"></path>
            </svg>
          </div>
        </section>

        {/* Stats / Trust Section */}
        <section id="impact" className="py-12 bg-background relative z-30 -mt-12">
          <div className="px-gutter max-w-container-max mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Impact Card 1 */}
              <div className="bg-impact-bg p-8 rounded-xl border-l-4 border-primary shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group animate-fade-in-up delay-100">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                  <span className="material-symbols-outlined text-[120px]">groups</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-2">200K+</h3>
                <p className="font-body-md text-body-md text-on-surface-variant font-bold">Lives Touched</p>
                <p className="font-body-sm text-sm text-outline mt-2">Across communities in Northern India through dedicated volunteer work.</p>
              </div>
              {/* Impact Card 2 */}
              <div className="bg-impact-bg p-8 rounded-xl border-l-4 border-secondary shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group animate-fade-in-up delay-200">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                  <span className="material-symbols-outlined text-[120px]">school</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-secondary mb-2">Student-Led</h3>
                <p className="font-body-md text-body-md text-on-surface-variant font-bold">India's Biggest</p>
                <p className="font-body-sm text-sm text-outline mt-2">Driven by the passion and energy of youth volunteers nationwide.</p>
              </div>
              {/* Impact Card 3 */}
              <div className="bg-impact-bg p-8 rounded-xl border-l-4 border-tertiary shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group animate-fade-in-up delay-300">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                  <span className="material-symbols-outlined text-[120px]">account_balance</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-tertiary mb-2">80G &amp; 12A</h3>
                <p className="font-body-md text-body-md text-on-surface-variant font-bold">Tax Exempted</p>
                <p className="font-body-sm text-sm text-outline mt-2">Officially registered UP Government NGO, ensuring transparency.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Impact in Action Gallery Section */}
        <section id="gallery" className="py-section-padding bg-surface-container-lowest relative z-20">
          <div className="px-gutter max-w-container-max mx-auto">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="font-display-lg text-display-lg text-on-surface mb-4">Our Impact in <span className="text-primary">Action</span></h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">Witness the smiles we've helped bring to communities across Northern India. Every picture tells a story of hope and resilience.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quote Image */}
              <div className="lg:col-span-3 rounded-2xl overflow-hidden animate-scale-in group bg-surface-variant/20 flex items-center justify-center p-4">
                <img 
                  alt="Founder's Quote and Work" 
                  className="w-full max-w-5xl h-auto object-contain transform group-hover:scale-[1.02] transition-transform duration-700" 
                  src="https://lh3.googleusercontent.com/aida/AP1WRLuaWI-zWljd8y4CaVj-8BFabDAhvlcbb4t_CaB8AQQpKogNbqHEhgBrGQVLfVETs6RdMkl60P5k1BlsT8IOU2LftA7R8SYPZk2zrZYQIUEW9jtpxzpqodLK3TTi3OEoyIESy78_Yw5f90nqDUL5KuAmIhwzRG3ektk7kLj5_9ryFN2ABH6fYVgG-aFT3bSxxLwNR-lBmYMbYFavLrTJKAZbvwUw0DLLlman11OzwK4_231LiPIhZ4IC070" 
                />
              </div>
              {/* Gallery Images */}
              <div className="rounded-2xl overflow-hidden shadow-lg animate-fade-in-up delay-100 animate-float group h-80 relative">
                <img 
                  alt="Community Celebrations" 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                  src="https://lh3.googleusercontent.com/aida/AP1WRLs2Qe61i08I3GcIkGqElytoksSC59PMaLwY6V3xVz-Y99lKm_DVn1KCGvk1L4gshoBXfhaLD5HhIrytffRsrn3B8tN1vHSjPBs2VD0VK-8Bm32iJC6il2_cUEVXlJAZZDhLJm1X2YMxzFIMauXL_aYM0xtzW6qjWgJo9M-_UkG_wX1XJ-ec-uPOaHS7ujGGdoAs2TgXyRmVh7zXBVdGYq0gjVxJ8tqwbUDExdrqr3h92OsRVGRgfhAK2A" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <p className="text-white font-headline-md">Community Celebrations</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg animate-fade-in-up delay-200 group h-80 md:col-span-2 relative">
                <img 
                  alt="Fostering Creativity" 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                  src="https://lh3.googleusercontent.com/aida/AP1WRLvAIq2HWbyvAJIuj3Y3So4s9A7g0XJa2VE_oI9UIESrpRvkT5HOmn0wZMtWfugihLLxe84dnY7QH5_KCArZD6wrq7giHe6JG5sBfFIK5V0lB8BmUh_SyaLVTzpxfhNjwjVhiYS-tmcuAZacJQfZQKEGqsHrj1DLhuvaCIsZH1fm47k2zU51TrykXkHRpssoi48Yv_A4QHwz_MMBWjW0x6WmzAf_v_octjDX9yQYKsDI1GqPc_hCSsQS6g" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <p className="text-white font-headline-md">Fostering Creativity</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg animate-fade-in-up delay-100 group h-[400px] relative">
                <img 
                  alt="Our Dedicated Team" 
                  className="w-full h-full object-cover object-top transform group-hover:scale-110 transition-transform duration-700" 
                  src="https://lh3.googleusercontent.com/aida/AP1WRLtxIAEnbTdzg5C5EArxjvoshV8mrd2RdS3-Jo8dMbH-sN2PEFNWMGSUm5UyyILqIul5tzexn3sF5388BnQFxniqB-LspZbfAud2MXXAPu57gqMBtsSdH0KnU4ul_67fJg9-qLXdSM0wkKQgIJOQxEJf7T0DlVpflPI5mGbJdpvURQbLv8Ufi2V3XHYEbVpeLiVcBEPy0qjtMawTA9qAb2NtLaUvObQ4tKLhFe5AF4Bq1tj0BWkcXHKcXNE" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <p className="text-white font-headline-md">Our Dedicated Team</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg animate-fade-in-up delay-300 animate-float-delayed group h-[400px] relative">
                <img 
                  alt="The Smiles We Work For" 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                  src="https://lh3.googleusercontent.com/aida/AP1WRLtYEl4A0trN0l4na6-P9Z_a9o1bzctkZRokviR5JEtgAH-SKaAnW-2XSkbqcF8-dhr2aQTdGoyAWkowaN6eT8fhUvjUgEzur9poe5bg2Gfe0PHtI6QEyMFkb3mpJ1Ph-2eEDjBfaQvttN3Kp5dlFBb8Ij-pCoScGT-cNT-g1ayYAYl2HBSl69gTJW5ykR5HHCt3DdCfbC90scL76qvlY21ZJQL5z_icCGYRgaQtZ3_FpJ2u-JOYFtk5C_Y" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <p className="text-white font-headline-md">The Smiles We Work For</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg animate-fade-in-up delay-200 group h-[400px] relative">
                <img 
                  alt="Together We Grow" 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                  src="https://lh3.googleusercontent.com/aida/AP1WRLsCHqNnm2S_I2AU4HWqVyyEXuYnfsK2gN_m8Njdy6SDohuv8yaLvpChAQ0q4rcdTsTmt3WqUOZSaEW0fTlU4Fo67_XAHyAZCT2td78RbW6eHoUfZUIMBzcbaFyvnjDioFFNJaunyO_R0kFBB1lF396-gXYNPyRtlTHwrPFuRavcWEEvqZetyXmTqn6H93gk3hhOL9Tsf8Mb7A4PSV4haMLgyQC0SSdTgi86RsG8s8aVjkyut0qZbWX8Xe4" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <p className="text-white font-headline-md">Together We Grow</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="footer" className="bg-inverse-surface text-primary-fixed w-full mt-auto border-t border-outline/20">
        <div className="w-full px-gutter py-section-padding max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-element-gap mb-12">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img 
                  alt="Naye Pankh Foundation Logo" 
                  className="h-12 w-12 rounded-full object-cover border border-primary-fixed/30" 
                  src="https://lh3.googleusercontent.com/aida/AP1WRLssL78yhtqOoSNJCxsGgQcIinfdP7o-h1P2N8vAiV3SFj106KYLiRWRz-QMr7lY4lcxxxWnCATx0lGdGmyGKTz4MdMOZqWNDQkRq6EN6mGT0NsSlGJxXTM1AtWmLedem6Ij-D5t2epkHgLxHD-BuWwGuosZdMAAiyxvmc8SuqQtKmGj6X93J2eKI_nshA-45kEVFfNmsLNQrRNds7qjrjxD0g4X0RhJNpr1oaKA2d6M-1ERbOGRCN1VZQg" 
                />
                <span className="font-headline-md text-headline-md font-bold text-primary-fixed">Naye Pankh Foundation</span>
              </div>
              <p className="font-body-md text-body-md text-surface-variant/80 mb-6 max-w-md">
                Service to mankind is the service to god. Let’s revolutionise the society together! Think global, Act local.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <span className="material-symbols-outlined text-[16px] text-primary-fixed">gavel</span>
                <span className="font-label-caps text-label-caps text-surface-variant/90">UP GOVT. | 80G &amp; 12A Registered</span>
              </div>
            </div>
            {/* Contact Column */}
            <div>
              <h4 className="font-headline-sm text-lg font-bold text-white mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
              <ul className="space-y-4 font-body-md text-body-md text-surface-variant/80">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-fixed mt-1">mail</span>
                  <a className="hover:text-primary-fixed transition-colors" href="mailto:contact@nayepankh.com">contact@nayepankh.com</a>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-fixed mt-1">call</span>
                  <a className="hover:text-primary-fixed transition-colors" href="tel:+918318500748">+91 8318500748</a>
                </li>
              </ul>
            </div>
            {/* Links Column */}
            <div>
              <h4 className="font-headline-sm text-lg font-bold text-white mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
              <ul className="space-y-3 font-body-md text-body-md text-surface-variant/80">
                <li><a className="hover:text-white transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Terms of Service</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Cancellation &amp; Refund</a></li>
                <li><a className="hover:text-white transition-colors" href="#">FAQ</a></li>
              </ul>
            </div>
          </div>
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-label-caps text-label-caps text-surface-variant/60 text-center md:text-left">
              © 2025 Naye Pankh Foundation. Registered NGO (80G &amp; 12A) | UP GOVT Registered.
            </p>
            <div className="flex items-center gap-4">
              <a className="text-surface-variant/60 hover:text-primary-fixed transition-colors p-2 rounded-full hover:bg-white/5 focus:ring-2 focus:ring-primary-fixed focus:ring-offset-2 focus:ring-offset-inverse-surface" href="#">
                <span className="material-symbols-outlined">public</span>
              </a>
              <a className="text-surface-variant/60 hover:text-primary-fixed transition-colors p-2 rounded-full hover:bg-white/5 focus:ring-2 focus:ring-primary-fixed focus:ring-offset-2 focus:ring-offset-inverse-surface" href="#">
                <span className="material-symbols-outlined">share</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
