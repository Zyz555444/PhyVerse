import React from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderMarkdown = (text: string): React.ReactNode => {
    // Simple markdown parser for basic formatting
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let inCodeBlock = false
    let codeContent = ''
    let codeLanguage = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Code block detection
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Start code block
          inCodeBlock = true
          codeLanguage = line.slice(3).trim()
          codeContent = ''
        } else {
          // End code block
          inCodeBlock = false
          elements.push(
            <pre key={`code-${i}`} className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-2">
              <code className={`language-${codeLanguage || 'text'} text-sm`}>
                {codeContent}
              </code>
            </pre>
          )
          codeContent = ''
          codeLanguage = ''
        }
        continue
      }

      if (inCodeBlock) {
        codeContent += line + '\n'
        continue
      }

      // Inline code
      let processedLine: React.ReactNode = line
      const codeRegex = /`([^`]+)`/g
      const codeMatches = [...line.matchAll(codeRegex)]
      
      if (codeMatches.length > 0) {
        const parts: React.ReactNode[] = []
        let lastIndex = 0
        
        codeMatches.forEach((match) => {
          const before = line.slice(lastIndex, match.index)
          if (before) parts.push(before)
          parts.push(
            <code key={`inline-${i}-${match.index}`} className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">
              {match[1]}
            </code>
          )
          lastIndex = (match.index || 0) + match[0].length
        })
        
        const after = line.slice(lastIndex)
        if (after) parts.push(after)
        
        processedLine = <>{parts}</>
      }

      // Bold text
      if (typeof processedLine === 'string') {
        const boldRegex = /\*\*([^*]+)\*\*/g
        const boldMatches = [...processedLine.matchAll(boldRegex)]
        
        if (boldMatches.length > 0) {
          const parts: React.ReactNode[] = []
          let lastIndex = 0
          
          boldMatches.forEach((match) => {
            const before = processedLine.slice(lastIndex, match.index)
            if (before) parts.push(before)
            parts.push(<strong key={`bold-${i}-${match.index}`}>{match[1]}</strong>)
            lastIndex = (match.index || 0) + match[0].length
          })
          
          const after = processedLine.slice(lastIndex)
          if (after) parts.push(after)
          
          processedLine = <>{parts}</>
        }
      }

      // Italic text
      if (typeof processedLine === 'string') {
        const italicRegex = /\*([^*]+)\*/g
        const italicMatches = [...processedLine.matchAll(italicRegex)]
        
        if (italicMatches.length > 0) {
          const parts: React.ReactNode[] = []
          let lastIndex = 0
          
          italicMatches.forEach((match) => {
            const before = processedLine.slice(lastIndex, match.index)
            if (before) parts.push(before)
            parts.push(<em key={`italic-${i}-${match.index}`}>{match[1]}</em>)
            lastIndex = (match.index || 0) + match[0].length
          })
          
          const after = processedLine.slice(lastIndex)
          if (after) parts.push(after)
          
          processedLine = <>{parts}</>
        }
      }

      // Headers
      if (typeof processedLine === 'string') {
        if (processedLine.startsWith('### ')) {
          elements.push(<h3 key={`h3-${i}`} className="text-lg font-semibold mt-4 mb-2">{processedLine.slice(4)}</h3>)
          continue
        } else if (processedLine.startsWith('## ')) {
          elements.push(<h2 key={`h2-${i}`} className="text-xl font-semibold mt-4 mb-2">{processedLine.slice(3)}</h2>)
          continue
        } else if (processedLine.startsWith('# ')) {
          elements.push(<h1 key={`h1-${i}`} className="text-2xl font-bold mt-4 mb-2">{processedLine.slice(2)}</h1>)
          continue
        }
      }

      // Lists
      if (typeof processedLine === 'string') {
        if (processedLine.startsWith('- ') || processedLine.startsWith('* ')) {
          elements.push(<li key={`li-${i}`} className="ml-4 list-disc">{processedLine.slice(2)}</li>)
          continue
        } else if (processedLine.match(/^\d+\. /)) {
          elements.push(<li key={`oli-${i}`} className="ml-4 list-decimal">{processedLine.replace(/^\d+\. /, '')}</li>)
          continue
        }
      }

      // Regular line
      if (processedLine === '') {
        elements.push(<br key={`br-${i}`} />)
      } else {
        elements.push(<p key={`p-${i}`} className="my-1">{processedLine}</p>)
      }
    }

    return elements
  }

  return <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>{renderMarkdown(content)}</div>
}
