import { QueryProvider } from "../../lib/providers/query-provider";

export default function BorrowLayout({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
