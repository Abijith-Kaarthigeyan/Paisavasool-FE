import { Fragment, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const LINE_ONE_WORDS = ["Experience", "smarter", "collections", "with", "your"]
const LINE_TWO_WORDS = ["accounts", "receivable", "assistant"]

const TAGLINE = [...LINE_ONE_WORDS, ...LINE_TWO_WORDS].join(" ")
const ALL_WORDS = [...LINE_ONE_WORDS, ...LINE_TWO_WORDS]
const RENDERED_CHAR_COUNT = ALL_WORDS.reduce((sum, word) => sum + word.length, 0)
const CHAR_DELAY_MS = 32

function renderWord(word: string, visibleCount: number, charIndex: { current: number }) {
  return (
    <span key={`${charIndex.current}-${word}`} className="ag-headline-word whitespace-nowrap">
      {word.split("").map((char) => {
        const index = charIndex.current++
        return (
          <span
            key={index}
            className={cn(
              "ag-headline-char inline-block",
              index < visibleCount && "ag-headline-char-visible"
            )}
            aria-hidden={index >= visibleCount}
          >
            {char}
          </span>
        )
      })}
    </span>
  )
}

function renderLine(
  words: string[],
  visibleCount: number,
  charIndex: { current: number },
  lineKey: string,
  lineClass: string
) {
  return (
    <span key={lineKey} className={cn("ag-headline-line", lineClass)}>
      {words.map((word) => (
        <Fragment key={`${lineKey}-${word}`}>{renderWord(word, visibleCount, charIndex)}</Fragment>
      ))}
    </span>
  )
}

export function LoginTypewriterHeadline() {
  const [visibleCount, setVisibleCount] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduceMotion(mq.matches)

    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    if (reduceMotion) {
      setVisibleCount(RENDERED_CHAR_COUNT)
      return
    }

    setVisibleCount(0)
    let count = 0
    const id = window.setInterval(() => {
      count += 1
      setVisibleCount(count)
      if (count >= RENDERED_CHAR_COUNT) {
        window.clearInterval(id)
      }
    }, CHAR_DELAY_MS)

    return () => window.clearInterval(id)
  }, [reduceMotion])

  const charIndex = { current: 0 }

  return (
    <h1 className="ag-headline mt-10 w-full max-w-4xl px-2" aria-label={TAGLINE}>
      {renderLine(LINE_ONE_WORDS, visibleCount, charIndex, "line-one", "ag-headline-line-primary")}
      {renderLine(LINE_TWO_WORDS, visibleCount, charIndex, "line-two", "ag-headline-line-secondary")}
    </h1>
  )
}
