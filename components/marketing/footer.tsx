import Link from 'next/link'
import { Activity, Github, Twitter, Linkedin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative bg-[#050810] border-t border-[rgba(0,255,200,0.1)]">
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,255,200,0.3)] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand column */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3 group">
              {/* Logo */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 border border-[rgba(0,255,200,0.3)] rounded-lg group-hover:border-[#00ffc8] transition-colors" />
                <Activity
                  className="w-5 h-5 text-[#00ffc8]"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 200, 0.5))' }}
                />
              </div>
              <div className="flex flex-col">
                <span
                  className="font-bold text-lg text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  LabVIEW Report Builder
                </span>
                <span
                  className="text-[10px] text-[#00ffc8]/50 font-mono tracking-wider"
                >
                  PRECISION REPORTING
                </span>
              </div>
            </Link>

            <p className="mt-6 text-gray-400 max-w-sm leading-relaxed">
              Design professional report templates visually. Download self-contained HTML files
              that work offline with LabVIEW integration. No DIAdem required.
            </p>

            {/* Status indicators */}
            <div className="mt-6 flex flex-col gap-2">
              <StatusItem label="System Status" value="OPERATIONAL" status="online" />
              <StatusItem label="Version" value="1.0.0" status="stable" />
            </div>

            {/* Social links */}
            <div className="mt-6 flex gap-4">
              <SocialLink href="#" icon={<Github className="w-4 h-4" />} label="GitHub" />
              <SocialLink href="#" icon={<Twitter className="w-4 h-4" />} label="Twitter" />
              <SocialLink href="#" icon={<Linkedin className="w-4 h-4" />} label="LinkedIn" />
            </div>
          </div>

          {/* Links columns */}
          <div className="md:col-span-2">
            <h3
              className="text-sm font-semibold text-[#00ffc8] mb-4 uppercase tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Product
            </h3>
            <ul className="space-y-3">
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="/pricing">Pricing</FooterLink>
              <FooterLink href="#">Documentation</FooterLink>
              <FooterLink href="#">Changelog</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3
              className="text-sm font-semibold text-[#00ffc8] mb-4 uppercase tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Resources
            </h3>
            <ul className="space-y-3">
              <FooterLink href="#">Getting Started</FooterLink>
              <FooterLink href="#">Templates</FooterLink>
              <FooterLink href="#">API Reference</FooterLink>
              <FooterLink href="#">Examples</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3
              className="text-sm font-semibold text-[#00ffc8] mb-4 uppercase tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Company
            </h3>
            <ul className="space-y-3">
              <FooterLink href="#">About</FooterLink>
              <FooterLink href="#">Blog</FooterLink>
              <FooterLink href="#">Contact</FooterLink>
              <FooterLink href="#">Privacy Policy</FooterLink>
              <FooterLink href="#">Terms of Service</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[rgba(0,255,200,0.1)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p
              className="text-sm text-gray-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              &copy; {new Date().getFullYear()} LabVIEW Report Builder. All rights reserved.
            </p>

            {/* Built with badge */}
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Built with Next.js + Supabase
              </span>
              <span className="text-[#00ffc8]/30">|</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Made for engineers
              </span>
            </div>
          </div>
        </div>

        {/* Terminal decoration */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[rgba(0,0,0,0.2)] border border-[rgba(0,255,200,0.05)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#39ff14]" />
            <span
              className="text-[10px] text-gray-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              CONNECTION: SECURE • ENCRYPTION: TLS 1.3
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-gray-400 hover:text-[#00ffc8] transition-colors group inline-flex items-center gap-1"
      >
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#00ffc8]">→</span>
        {children}
      </Link>
    </li>
  )
}

function StatusItem({ label, value, status }: { label: string; value: string; status: 'online' | 'stable' }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-gray-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {label}:
      </span>
      <div className="flex items-center gap-1.5">
        <div
          className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-[#39ff14]' : 'bg-[#00ffc8]'}`}
          style={{
            boxShadow: status === 'online'
              ? '0 0 6px rgba(57, 255, 20, 0.6)'
              : '0 0 6px rgba(0, 255, 200, 0.6)'
          }}
        />
        <span
          className={status === 'online' ? 'text-[#39ff14]' : 'text-[#00ffc8]'}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(0,255,200,0.1)] text-gray-400 hover:text-[#00ffc8] hover:border-[rgba(0,255,200,0.3)] transition-colors"
      aria-label={label}
    >
      {icon}
    </a>
  )
}
