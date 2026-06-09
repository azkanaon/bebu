export default function BookshelfLayout({
  children,
  modal, // Ini adalah 'slot' untuk modal kita nanti
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
