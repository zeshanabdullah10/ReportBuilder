'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'What happens to my templates if I cancel my subscription?',
    answer: 'Your downloaded HTML templates continue to work forever. They are self-contained and don\'t require an active subscription to generate reports.',
  },
  {
    question: 'Can I use the templates on offline test stations?',
    answer: 'Yes! Downloaded templates are completely self-contained HTML files with all JavaScript and CSS embedded. They work without internet access.',
  },
  {
    question: 'How does LabVIEW integrate with the templates?',
    answer: 'LabVIEW writes test data to a JSON file in the same directory as the template. When the HTML file is opened in Chrome, it automatically loads the data and can trigger PDF generation.',
  },
  {
    question: 'Is there a limit on how many reports I can generate?',
    answer: 'No, once you download a template, you can generate unlimited reports with it. The subscription only affects template creation and downloads.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes, we offer 2 months free when you pay annually. Contact us for more details.',
  },
]

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
        Frequently Asked Questions
      </h2>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-slate-200 rounded-lg overflow-hidden"
          >
            <button
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className="font-medium text-slate-900">{faq.question}</span>
              <ChevronDown
                className={`h-5 w-5 text-slate-500 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 text-slate-600">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
