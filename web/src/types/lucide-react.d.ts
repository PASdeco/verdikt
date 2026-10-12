declare module "lucide-react" {
  import type { SVGProps } from "react";
  export type LucideProps = SVGProps<SVGSVGElement> & { size?: number | string };
  export const Sun: (p: LucideProps) => JSX.Element;
  export const Moon: (p: LucideProps) => JSX.Element;
  export const Menu: (p: LucideProps) => JSX.Element;
  export const X: (p: LucideProps) => JSX.Element;
  export const Wallet: (p: LucideProps) => JSX.Element;
  const _default: unknown;
  export default _default;
}
