import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Layout, Zap } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Professional Reports for{' '}
            <span className="text-primary-600">LabVIEW</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Design report templates visually in your browser. Download self-contained HTML files
            that generate PDFs offline. No DIAdem license required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start Building Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-600 mb-4">
              <Layout className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900">Visual Builder</h3>
            <p className="mt-2 text-slate-600">
              Drag-and-drop interface to design professional report layouts
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-600 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900">Offline Templates</h3>
            <p className="mt-2 text-slate-600">
              Download self-contained HTML files that work without internet
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-600 mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900">LabVIEW Integration</h3>
            <p className="mt-2 text-slate-600">
              Simple JSON data files. Automatic PDF generation via headless Chrome
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
