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
      <h2
        className="text-2xl font-bold text-white text-center mb-10"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        Frequently Asked Questions
      </h2>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-[rgba(10,20,30,0.8)] to-[rgba(15,30,45,0.7)] border border-[rgba(0,255,200,0.15)] rounded-lg overflow-hidden transition-all duration-300 hover:border-[rgba(0,255,200,0.3)]"
          >
            <button
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[rgba(0,255,200,0.03)] transition-colors"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className="font-medium text-white">{faq.question}</span>
              <ChevronDown
                className={`h-5 w-5 text-[#00ffc8] transition-transform duration-200 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 text-gray-400 border-t border-[rgba(0,255,200,0.1)] pt-4">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
