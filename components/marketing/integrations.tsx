'use client'

import { useState } from 'react'
import { Code2, Terminal, FileCode, Braces, Copy, Check } from 'lucide-react'

const languages = [
  {
    id: 'python',
    name: 'Python',
    icon: Braces,
    color: '#3776AB',
    code: `import json
import subprocess

# Your test data
data = {
    "test_name": "Temperature Stress Test",
    "result": "PASS",
    "measurements": [23.5, 24.1, 23.8],
    "unit": "°C",
    "duration": "2 hours"
}

# Write data to JSON file
with open('data.json', 'w') as f:
    json.dump(data, f, indent=2)

# Generate PDF using headless Chrome
subprocess.run([
    'chrome', '--headless', '--disable-gpu',
    '--print-to-pdf=report.pdf',
    '--inject-script=inject-data.js',
    'template.html'
])`,
  },
  {
    id: 'csharp',
    name: 'C#',
    icon: Code2,
    color: '#512BD4',
    code: `using System;
using System.IO;
using System.Text.Json;
using System.Diagnostics;

// Your test data
var data = new {
    test_name = "Voltage Test",
    result = "PASS",
    measurements = new[] { 5.1, 5.0, 5.2 },
    unit = "V",
    duration = "30 minutes"
};

// Write data to JSON file
string json = JsonSerializer.Serialize(data, new JsonSerializerOptions {
    WriteIndented = true
});
File.WriteAllText("data.json", json);

// Generate PDF using headless Chrome
var process = new Process {
    StartInfo = new ProcessStartInfo {
        FileName = "chrome",
        Arguments = "--headless --disable-gpu --print-to-pdf=report.pdf template.html",
        RedirectStandardOutput = true
    }
};
process.Start();
process.WaitForExit();`,
  },
  {
    id: 'labview',
    name: 'LabVIEW',
    icon: Terminal,
    color: '#FFDB00',
    code: `// LabVIEW Implementation (Block Diagram)

// 1. Build your test data cluster
// Test Data Cluster:
//   - test_name: "Frequency Response Test"
//   - result: "PASS"
//   - measurements: Array of DBL [100.5, 101.2, 99.8]
//   - unit: "Hz"
//   - duration: "15 minutes"

// 2. Convert cluster to JSON string
// Use "Flatten To JSON" or "Stringify" VI
JSON String ──────> Write To Text File ──────> data.json

// 3. Generate PDF with System Exec VI
System Exec VI:
  Command Line: chrome --headless --disable-gpu --print-to-pdf=report.pdf template.html
  Wait Until Done? : TRUE
  
// Output: report.pdf`,
  },
  {
    id: 'matlab',
    name: 'MATLAB',
    icon: FileCode,
    color: '#E16737',
    code: `% Your test data
data = struct(...
    'test_name', 'Signal Integrity Test', ...
    'result', 'PASS', ...
    'measurements', [0.95, 0.98, 1.02, 0.99], ...
    'unit', 'V', ...
    'duration', '45 minutes' ...
);

% Write data to JSON file
jsonStr = jsonencode(data, 'PrettyPrint', true);
fid = fopen('data.json', 'w');
fprintf(fid, '%s', jsonStr);
fclose(fid);

% Generate PDF using headless Chrome
system('chrome --headless --disable-gpu --print-to-pdf=report.pdf template.html');

disp('Report generated: report.pdf');`,
  },
]

export function Integrations() {
  const [activeLanguage, setActiveLanguage] = useState('python')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const code = languages.find(l => l.id === activeLanguage)?.code || ''
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeLang = languages.find(l => l.id === activeLanguage) || languages[0]

  return (
    <section className="relative py-24 bg-[#0a0f14] overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-oscilloscope-grid opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(0,255,200,0.2)] bg-[rgba(0,255,200,0.05)] mb-6"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Code2 className="w-4 h-4 text-[#00ffc8]" />
            <span className="text-xs text-[#00ffc8] uppercase tracking-widest">Integration</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Works with{' '}
            <span className="text-[#00ffc8]" style={{
              textShadow: '0 0 20px rgba(0, 255, 200, 0.4)'
            }}>any language</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            If your test framework can write JSON, it can generate reports. No SDK required.
          </p>
        </div>

        {/* Language tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setActiveLanguage(lang.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300
                ${activeLanguage === lang.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                }
              `}
              style={{
                backgroundColor: activeLanguage === lang.id ? `${lang.color}20` : undefined,
                border: `1px solid ${activeLanguage === lang.id ? lang.color + '50' : 'rgba(255,255,255,0.1)'}`,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <lang.icon className="w-4 h-4" style={{ color: activeLanguage === lang.id ? lang.color : undefined }} />
              {lang.name}
            </button>
          ))}
        </div>

        {/* Code block */}
        <div className="relative max-w-4xl mx-auto">
          {/* Code header */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-t-lg border-b"
            style={{
              backgroundColor: 'rgba(5,8,16,0.8)',
              borderColor: `${activeLang.color}30`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span
                className="text-sm text-gray-400"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {activeLang.name.toLowerCase()}_report_generator.{activeLang.id === 'python' ? 'py' : activeLang.id === 'csharp' ? 'cs' : activeLang.id === 'matlab' ? 'm' : 'txt'}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-all"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#39ff14]" />
                  <span className="text-[#39ff14]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Code content */}
          <div
            className="p-6 rounded-b-lg overflow-x-auto"
            style={{
              backgroundColor: 'rgba(5,8,16,0.9)',
              border: `1px solid ${activeLang.color}20`,
              borderTop: 'none',
            }}
          >
            <pre
              className="text-sm leading-relaxed"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {activeLang.code.split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span className="text-gray-600 w-8 flex-shrink-0 select-none">{i + 1}</span>
                  <span className="text-gray-300">{line}</span>
                </div>
              ))}
            </pre>
          </div>

          {/* Glow effect */}
          <div
            className="absolute -inset-1 rounded-lg opacity-20 blur-xl -z-10"
            style={{ backgroundColor: activeLang.color }}
          />
        </div>

        {/* Bottom note */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            The same template works with all languages • Just swap the JSON data source
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="flex items-center justify-center mt-12 gap-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-[rgba(0,255,200,0.3)]" />
          <div className="w-2 h-2 rotate-45 border border-[#00ffc8]/50" />
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-[rgba(0,255,200,0.3)]" />
        </div>
      </div>
    </section>
  )
}
