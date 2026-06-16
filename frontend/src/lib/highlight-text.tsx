export function HighlightText({
  text,
  highlight,
}: {
  text: string
  highlight: string
}) {
  if (!highlight.trim()) return <span>{text}</span>

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span
            key={i}
            className="bg-blue-500/30 text-blue-300 rounded-sm px-0.5 font-bold"
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  )
}
