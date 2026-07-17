// Zeugnis per Foto einlesen. Läuft komplett im Browser (kein eigener Server
// nötig) über Tesseract.js. Texterkennung auf Fotos ist nie perfekt -
// deshalb liefert diese Funktion nur VORSCHLÄGE (erkannter Text + geratenes
// Fach/Note), die im nächsten Schritt von Hand geprüft/korrigiert werden,
// bevor irgendetwas gespeichert wird.

export interface OcrGuess {
  id: string
  rawLine: string
  subjectGuess: string
  gradeGuess: number | null
}

export async function recognizeReportCardImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<OcrGuess[]> {
  // Dynamischer Import: Tesseract.js (inkl. WASM/Sprachdaten) wird nur
  // geladen, wenn diese Funktion tatsächlich aufgerufen wird.
  const { createWorker } = await import('tesseract.js')

  const worker = await createWorker('deu', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })

  try {
    const {
      data: { text },
    } = await worker.recognize(file)
    return parseLines(text)
  } finally {
    await worker.terminate()
  }
}

function parseLines(text: string): OcrGuess[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 1)
    .map((line, index) => {
      // Sucht eine einzelne Ziffer 1-6 (optional mit Komma-/Punkt-Dezimalstelle)
      // als Notenkandidat, z. B. in "Mathematik 2" oder "Deutsch: 3,0"
      const match = line.match(/\b([1-6])(?:[.,](\d))?\b/)
      let gradeGuess: number | null = null
      if (match) {
        const whole = match[1]
        const decimal = match[2] ?? '0'
        gradeGuess = parseFloat(`${whole}.${decimal}`)
      }
      const subjectGuess = line
        .replace(/\b[1-6](?:[.,]\d)?\b/, '')
        .replace(/[^a-zA-ZäöüÄÖÜß\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      return {
        id: `ocr-${index}-${Math.random().toString(36).slice(2, 8)}`,
        rawLine: line,
        subjectGuess,
        gradeGuess,
      }
    })
    .filter((r) => r.subjectGuess.length > 1)
}
