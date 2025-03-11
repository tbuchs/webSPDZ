import { defineConfig } from 'vite'
import { run } from 'vite-plugin-run'

export default defineConfig(({ mode }) => {
  return {
    root: "mpyc-web-py",
    plugins: [
      run([
        {
          name: 'python transform',
          run: ['yarn', 'build:py'],
          condition: (file: string) => {
            return file.endsWith('.py') || file.endsWith('pyproject.toml')
          },
        }
      ]),
    ],
  }
})
