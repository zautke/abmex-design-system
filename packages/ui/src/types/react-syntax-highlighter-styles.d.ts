// @types/react-syntax-highlighter declares the extensionless style module
// (".../styles/prism/vsc-dark-plus") but not the explicit ".js" specifier.
// We import the ".js" form so the emitted ESM is resolvable by strict-ESM
// runtimes (raw Node ESM rejects the bare directory import). Map the suffixed
// specifier to the same default export the upstream types provide.
declare module 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus.js' {
  import type { CSSProperties } from 'react';
  const style: { [key: string]: CSSProperties };
  export default style;
}
