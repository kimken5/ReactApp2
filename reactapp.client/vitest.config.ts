/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // テスト環境設定
    environment: 'jsdom',
    
    // セットアップファイル
    setupFiles: ['./src/test/setup.ts'],
    
    // テストファイルのパターン
    include: [
      'src/**/__tests__/**/*.{js,ts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      '.next/',
      'coverage/'
    ],
    
    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      // カバレッジ閾値設定
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95
    },
    
    // テスト実行設定
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    
    // パフォーマンス設定
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 並列実行設定
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4
      }
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@test': path.resolve(__dirname, './src/test')
    }
  }
})