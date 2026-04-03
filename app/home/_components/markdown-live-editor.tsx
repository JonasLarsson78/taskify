'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { marked } from 'marked'
import styles from '../page.module.css'

type MarkdownLiveEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  initialMode?: 'text' | 'preview'
}

function markdownToHtml(value: string): string {
  const rendered = marked.parse(value || '', {
    async: false,
    gfm: true,
    breaks: true,
  })
  return typeof rendered === 'string' ? rendered : ''
}

export default function MarkdownLiveEditor({
  value,
  onChange,
  placeholder,
  disabled,
  initialMode = 'text',
}: MarkdownLiveEditorProps) {
  const [mode, setMode] = useState<'text' | 'preview'>(initialMode)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const previewHtml = useMemo(() => markdownToHtml(value), [value])

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  function updateSelection(nextValue: string, start: number, end: number) {
    onChange(nextValue)
    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(start, end)
    })
  }

  function wrapSelection(prefix: string, suffix: string = prefix) {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)
    const nextValue =
      value.slice(0, start) + prefix + selected + suffix + value.slice(end)

    const nextStart = start + prefix.length
    const nextEnd = nextStart + selected.length
    updateSelection(nextValue, nextStart, nextEnd)
  }

  function prefixLines(prefix: string, numbered: boolean = false) {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)
    if (selected.length === 0) {
      const insert = numbered ? '1. ' : prefix
      const nextValue = value.slice(0, start) + insert + value.slice(end)
      const cursor = start + insert.length
      updateSelection(nextValue, cursor, cursor)
      return
    }

    const lines = selected.split('\n')
    const nextLines = lines.map((line, index) => {
      if (line.trim().length === 0) return line
      if (numbered) return `${index + 1}. ${line}`
      return `${prefix}${line}`
    })

    const insert = nextLines.join('\n')
    const nextValue = value.slice(0, start) + insert + value.slice(end)
    updateSelection(nextValue, start, start + insert.length)
  }

  function insertAtSelection(insert: string) {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const nextValue = value.slice(0, start) + insert + value.slice(end)
    const cursor = start + insert.length
    updateSelection(nextValue, cursor, cursor)
  }

  return (
    <div className={styles.markdownEditorShell}>
      <div className={styles.markdownToolbar}>
        <button
          type="button"
          className={styles.markdownToolbarBtn}
          disabled={disabled || mode === 'preview'}
          onClick={() => wrapSelection('**')}
          title="Bold"
        >
          Bold
        </button>
        <button
          type="button"
          className={styles.markdownToolbarBtn}
          disabled={disabled || mode === 'preview'}
          onClick={() => wrapSelection('_')}
          title="Italic"
        >
          Italic
        </button>
        <button
          type="button"
          className={styles.markdownToolbarBtn}
          disabled={disabled || mode === 'preview'}
          onClick={() => prefixLines('- ')}
          title="Bulleted list"
        >
          List
        </button>
        <button
          type="button"
          className={styles.markdownToolbarBtn}
          disabled={disabled || mode === 'preview'}
          onClick={() => prefixLines('', true)}
          title="Numbered list"
        >
          1. List
        </button>
        <button
          type="button"
          className={styles.markdownToolbarBtn}
          disabled={disabled || mode === 'preview'}
          onClick={() => insertAtSelection('[text](https://)')}
          title="Insert link"
        >
          Link
        </button>
        <button
          type="button"
          className={styles.markdownToolbarBtn}
          disabled={disabled || mode === 'preview'}
          onClick={() => insertAtSelection('\n```\n\n```\n')}
          title="Insert code block"
        >
          Code
        </button>
        <span className={styles.markdownToolbarSpacer} />
        <button
          type="button"
          className={`${styles.markdownToolbarBtn} ${
            mode === 'text' ? styles.markdownToolbarBtnActive : ''
          }`}
          disabled={disabled}
          onClick={() => setMode('text')}
        >
          Text
        </button>
        <button
          type="button"
          className={`${styles.markdownToolbarBtn} ${
            mode === 'preview' ? styles.markdownToolbarBtnActive : ''
          }`}
          disabled={disabled}
          onClick={() => setMode('preview')}
        >
          Preview
        </button>
      </div>

      {mode === 'text' ? (
        <textarea
          ref={textareaRef}
          className={styles.createTextarea}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div
          className={styles.markdownPreview}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}
    </div>
  )
}
