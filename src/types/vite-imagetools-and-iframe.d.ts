// Asset imports with query strings (e.g. vite-imagetools `?w=640&format=webp`)
declare module "*?*" {
  const src: string;
  export default src;
}
declare module "*.jpg?*" {
  const src: string;
  export default src;
}
declare module "*.jpeg?*" {
  const src: string;
  export default src;
}
declare module "*.png?*" {
  const src: string;
  export default src;
}
declare module "*.webp?*" {
  const src: string;
  export default src;
}

// Experimental iframe attribute used for third-party isolation.
// React's typings may not include this yet.
import "react";
declare module "react" {
  interface IframeHTMLAttributes<T> {
    credentialless?: string | boolean;
  }
}

