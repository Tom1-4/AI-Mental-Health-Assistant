/// <reference types="vite/client" />

declare module "*.jpeg" {
  const src: string
  export default src
}

declare module "*.jpg" {
  const src: string
  export default src
}

declare module "*.png" {
  const src: string
  export default src
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean
  }

  export interface InternalAxiosRequestConfig {
    skipAuth?: boolean
  }
}