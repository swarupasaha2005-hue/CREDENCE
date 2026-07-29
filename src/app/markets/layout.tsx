import { QueryProvider } from "../../lib/providers/query-provider";

export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
