import fs from "node:fs"
import path from "node:path"

type CodeThemeData = {
  lightThemeCss: string
  darkThemeCss: string
}

const emptyThemes: CodeThemeData = {
  lightThemeCss: "",
  darkThemeCss: "",
}

export function getCodeThemeData(): CodeThemeData {
  const themePath = path.join(process.cwd(), "generated", "active-code-themes.json")

  try {
    return JSON.parse(fs.readFileSync(themePath, "utf8")) as CodeThemeData
  } catch {
    return emptyThemes
  }
}
