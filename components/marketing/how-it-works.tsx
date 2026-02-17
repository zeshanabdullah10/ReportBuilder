import { Palette, Download, FileJson } from 'lucide-react'

const steps = [
  {
    step: '1',
    icon: Palette,
    title: 'Design Your Template',
    description: 'Use the visual builder to create your report layout. Drag components, configure styles, and define data bindings.',
  },
  {
    step: '2',
    icon: Download,
    title: 'Download HTML',
    description: 'Export your template as a single self-contained HTML file with all dependencies embedded.',
  },
  {
    step: '3',
    icon: FileJson,
    title: 'Integrate with LabVIEW',
    description: 'Write test data to a JSON file. LabVIEW calls headless Chrome to generate PDFs automatically.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            From design to PDF in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item) => (
            <div key={item.step} className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 text-white text-2xl font-bold mb-6">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
