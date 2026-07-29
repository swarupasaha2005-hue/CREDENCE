import { QueryProvider } from "../../lib/providers/query-provider";

export default function EarnLayout({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
