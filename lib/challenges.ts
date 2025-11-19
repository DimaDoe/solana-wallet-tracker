// Challenge Types
export type ChallengeType = 'distorted' | 'symbol' | 'pattern'

export interface Challenge {
  type: ChallengeType
  id: string
  data: ChallengeData
}

export interface ChallengeData {
  image?: string
  images?: string[]
  legend?: Record<string, string>
  solution: string | number
}

// Word list for challenges
const WORDS = [
  'alpha', 'bravo', 'delta', 'foxtrot', 'gamma',
  'hotel', 'india', 'juliet', 'kilo', 'lima',
  'oscar', 'papa', 'romeo', 'sierra', 'tango',
  'ultra', 'victor', 'whisky', 'xray', 'zulu',
  'storm', 'flame', 'ocean', 'river', 'cloud',
  'light', 'stone', 'frost', 'blade', 'crown'
]

// Symbol mappings
const SYMBOLS = ['🔺', '⬛', '🔵', '⭐', '🔶', '💠', '🔷', '⬜', '🟢', '🟣']

// Generate random string
function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Get random word
function getRandomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

// Type A: Distorted Text Challenge
export function generateDistortedChallenge(): Challenge {
  const word = getRandomWord().toUpperCase()
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null

  if (!canvas) {
    return {
      type: 'distorted',
      id: generateId(),
      data: { image: '', solution: word.toLowerCase() }
    }
  }

  canvas.width = 300
  canvas.height = 100
  const ctx = canvas.getContext('2d')!

  // Background with noise
  ctx.fillStyle = '#1e1b4b'
  ctx.fillRect(0, 0, 300, 100)

  // Add noise
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.1)`
    ctx.fillRect(Math.random() * 300, Math.random() * 100, 2, 2)
  }

  // Draw letters with distortion
  const letterWidth = 50
  const startX = (300 - word.length * letterWidth) / 2 + 25

  word.split('').forEach((letter, i) => {
    ctx.save()

    // Random transformations
    const x = startX + i * letterWidth
    const y = 50 + Math.sin(i) * 10
    const rotation = (Math.random() - 0.5) * 0.4
    const scale = 0.8 + Math.random() * 0.4

    ctx.translate(x, y)
    ctx.rotate(rotation)
    ctx.scale(scale, scale)

    // Draw letter
    ctx.font = 'bold 36px monospace'
    ctx.fillStyle = `hsl(${250 + Math.random() * 30}, 80%, 70%)`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(letter, 0, 0)

    ctx.restore()
  })

  // Add lines for additional distortion
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(99, 102, 241, ${0.3 + Math.random() * 0.3})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, Math.random() * 100)
    ctx.bezierCurveTo(
      100, Math.random() * 100,
      200, Math.random() * 100,
      300, Math.random() * 100
    )
    ctx.stroke()
  }

  return {
    type: 'distorted',
    id: generateId(),
    data: {
      image: canvas.toDataURL(),
      solution: word.toLowerCase()
    }
  }
}

// Type B: Symbol Code Challenge
export function generateSymbolChallenge(): Challenge {
  const word = getRandomWord().toUpperCase()
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  // Create random mapping (only for letters in the word)
  const usedLetters = [...new Set(word.split(''))]
  const shuffledSymbols = [...SYMBOLS].sort(() => Math.random() - 0.5)
  const mapping: Record<string, string> = {}

  usedLetters.forEach((letter, i) => {
    mapping[letter] = shuffledSymbols[i % shuffledSymbols.length]
  })

  // Encode word
  const encoded = word.split('').map(l => mapping[l]).join(' ')

  // Create canvas
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null

  if (!canvas) {
    return {
      type: 'symbol',
      id: generateId(),
      data: { image: '', legend: mapping, solution: word.toLowerCase() }
    }
  }

  canvas.width = 400
  canvas.height = 120
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = '#1e1b4b'
  ctx.fillRect(0, 0, 400, 120)

  // Draw encoded message
  ctx.font = '48px serif'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(encoded, 200, 60)

  return {
    type: 'symbol',
    id: generateId(),
    data: {
      image: canvas.toDataURL(),
      legend: mapping,
      solution: word.toLowerCase()
    }
  }
}

// Type C: Pattern Recognition Challenge
export function generatePatternChallenge(): Challenge {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null

  if (!canvas) {
    return {
      type: 'pattern',
      id: generateId(),
      data: { images: [], solution: 0 }
    }
  }

  // Generate base pattern
  const baseColor = Math.floor(Math.random() * 360)
  const images: string[] = []
  const differentIndex = Math.floor(Math.random() * 4)

  for (let i = 0; i < 4; i++) {
    const c = document.createElement('canvas')
    c.width = 100
    c.height = 100
    const ctx = c.getContext('2d')!

    // Background
    ctx.fillStyle = '#1e1b4b'
    ctx.fillRect(0, 0, 100, 100)

    // Draw shapes
    const isDifferent = i === differentIndex

    // Main circle
    ctx.beginPath()
    ctx.arc(50, 50, 30, 0, Math.PI * 2)
    ctx.fillStyle = `hsl(${baseColor}, 70%, ${isDifferent ? 55 : 50}%)`
    ctx.fill()

    // Inner pattern
    ctx.beginPath()
    if (isDifferent) {
      // Slightly different - square instead of rotated square
      ctx.rect(38, 38, 24, 24)
    } else {
      // Normal - rotated square
      ctx.save()
      ctx.translate(50, 50)
      ctx.rotate(Math.PI / 4)
      ctx.rect(-10, -10, 20, 20)
      ctx.restore()
    }
    ctx.fillStyle = `hsl(${baseColor + 30}, 70%, 60%)`
    ctx.fill()

    // Small dot (position slightly different for the odd one)
    ctx.beginPath()
    ctx.arc(
      isDifferent ? 52 : 50,
      isDifferent ? 32 : 30,
      4,
      0,
      Math.PI * 2
    )
    ctx.fillStyle = '#fff'
    ctx.fill()

    images.push(c.toDataURL())
  }

  return {
    type: 'pattern',
    id: generateId(),
    data: {
      images,
      solution: differentIndex
    }
  }
}

// Generate random challenge
export function generateChallenge(): Challenge {
  const types: ChallengeType[] = ['distorted', 'symbol', 'pattern']
  const type = types[Math.floor(Math.random() * types.length)]

  switch (type) {
    case 'distorted':
      return generateDistortedChallenge()
    case 'symbol':
      return generateSymbolChallenge()
    case 'pattern':
      return generatePatternChallenge()
  }
}

// Verify challenge answer
export function verifyChallenge(challenge: Challenge, answer: string | number): boolean {
  if (challenge.type === 'pattern') {
    return Number(answer) === Number(challenge.data.solution)
  }
  return String(answer).toLowerCase().trim() === String(challenge.data.solution).toLowerCase()
}
