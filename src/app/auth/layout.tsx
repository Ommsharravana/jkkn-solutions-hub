export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth pages have their own simple layout (no sidebar/header)
  return <>{children}</>
}
