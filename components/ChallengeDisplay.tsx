'use client'

import { FC, useState } from 'react'
import { Challenge } from '@/lib/challenges'

interface Props {
  challenge: Challenge
  onSubmit: (answer: string | number) => void
  onNewChallenge: () => void
}

export const ChallengeDisplay: FC<Props> = ({ challenge, onSubmit, onNewChallenge }) => {
  const [answer, setAnswer] = useState('')
  const [selectedPattern, setSelectedPattern] = useState<number | null>(null)

  function handleSubmit() {
    if (challenge.type === 'pattern') {
      if (selectedPattern !== null) {
        onSubmit(selectedPattern)
      }
    } else {
      if (answer.trim()) {
        onSubmit(answer)
        setAnswer('')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Challenge Image */}
      {challenge.type === 'distorted' && challenge.data.image && (
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-4">
            Type the word shown in the image
          </p>
          <img
            src={challenge.data.image}
            alt="Challenge"
            className="mx-auto rounded-lg challenge-canvas"
          />
        </div>
      )}

      {challenge.type === 'symbol' && (
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-4">
            Decode the symbols using the legend below
          </p>
          {challenge.data.image && (
            <img
              src={challenge.data.image}
              alt="Symbol Challenge"
              className="mx-auto rounded-lg challenge-canvas mb-4"
            />
          )}

          {/* Legend */}
          {challenge.data.legend && (
            <div className="bg-black/30 rounded-lg p-4 inline-block">
              <div className="grid grid-cols-3 gap-3 text-sm">
                {Object.entries(challenge.data.legend).map(([letter, symbol]) => (
                  <div key={letter} className="flex items-center gap-2">
                    <span className="text-lg">{symbol}</span>
                    <span className="text-gray-400">=</span>
                    <span className="font-mono">{letter}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {challenge.type === 'pattern' && challenge.data.images && (
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-4">
            Click on the image that is different from the others
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            {challenge.data.images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedPattern(index)}
                className={`rounded-lg overflow-hidden transition-all ${
                  selectedPattern === index
                    ? 'ring-4 ring-1rw-primary scale-105'
                    : 'hover:scale-105'
                }`}
              >
                <img src={img} alt={`Option ${index + 1}`} className="w-full" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input for text-based challenges */}
      {(challenge.type === 'distorted' || challenge.type === 'symbol') && (
        <div>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter your answer"
            className="w-full px-4 py-3 bg-black/30 rounded-lg border border-white/10 focus:border-1rw-primary outline-none transition-colors"
            autoFocus
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onNewChallenge}
          className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
        >
          New Challenge
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            challenge.type === 'pattern'
              ? selectedPattern === null
              : !answer.trim()
          }
          className="flex-1 px-4 py-3 bg-1rw-primary hover:bg-1rw-secondary rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    </div>
  )
}
