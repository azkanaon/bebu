export default function BookshelfLayout({
  children,
  modal, // Ini adalah 'slot' untuk modal kita nanti
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children} {/* Ini adalah isi BookshelfClient kamu */}
      {modal} {/* Ini adalah tempat Modal akan 'menempel' */}
    </>
  )
}
