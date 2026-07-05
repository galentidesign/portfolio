export interface BuildOptions {
  tokensDir?: string | undefined
  outDir?: string | undefined
  fontsDir?: string | undefined
}

export interface BuildResult {
  files: string[]
  warnings: string[]
}

export declare function buildTokens(options?: BuildOptions): BuildResult
