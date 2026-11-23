const flagIndex = process.argv.indexOf('--base-url')
const baseUrl = flagIndex !== -1
  ? (process.argv[flagIndex + 1] || 'http://127.0.0.1:8000')
  : (process.argv[2] || 'http://127.0.0.1:8000')
const questions = [
  'குறள் 391 பற்றி விளக்குங்கள்.',
  'நல்ல நட்பை எப்படி வளர்க்கலாம்?',
  'கல்வியின் முக்கியத்துவம் என்ன?',
  'சாணக்கிய நீதியின் உத்திகள் பற்றி சொல்லுங்கள்.',
  'அத்தியாயம் 5 பாடல் 12 கிடைக்குமா?'
]

for (const question of questions) {
  const response = await fetch(`${baseUrl}/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ session_id: 'rust-smoke-session', message: question })
  })
  if (!response.ok) throw new Error(`${question}: HTTP ${response.status}`)
  const data = await response.json()
  if (typeof data.reply !== 'string' || !Array.isArray(data.citations)) {
    throw new Error(`${question}: invalid response schema`)
  }
  console.log(`\nQ: ${question}\nA: ${data.reply}`)
  for (const citation of data.citations) {
    if (!citation.id || !citation.label || typeof citation.text_ta !== 'string') {
      throw new Error(`${question}: invalid citation schema`)
    }
    console.log(`${citation.id}\n${citation.label}\n${citation.text_ta}`)
  }
}