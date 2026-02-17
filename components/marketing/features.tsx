import { BarChart3, Table, Type, Image, CheckCircle, Layers } from 'lucide-react'

const features = [
  {
    icon: Type,
    title: 'Rich Text Blocks',
    description: 'Add formatted text with variable bindings for dynamic data from LabVIEW.',
  },
  {
    icon: Table,
    title: 'Dynamic Tables',
    description: 'Create tables that automatically populate from array data in your JSON.',
  },
  {
    icon: BarChart3,
    title: 'Charts & Graphs',
    description: 'Line, bar, pie, and scatter charts powered by Chart.js for data visualization.',
  },
  {
    icon: Image,
    title: 'Images & Logos',
    description: 'Add company logos, product images, or data-driven visual elements.',
  },
  {
    icon: CheckCircle,
    title: 'Pass/Fail Indicators',
    description: 'Visual status indicators for test results with customizable thresholds.',
  },
  {
    icon: Layers,
    title: 'Flexible Layouts',
    description: 'Grid-based layouts with containers, spacers, and page breaks.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Everything you need for test reports
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Build professional reports with the components you need, without the complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-lg transition-all"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 text-primary-600 mb-4">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
