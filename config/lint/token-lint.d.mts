export interface Hit {
  file: string
  line: number
  text: string
}

export interface ScanOptions {
  skip?: string[]
}

export declare function scanForRawTokens(roots: string[], options?: ScanOptions): Promise<Hit[]>
