#!/usr/bin/env node
import inquirer from "inquirer";
import chalk from "chalk";
import figlet from "figlet";
import gradient from "gradient-string";
import { execa } from "execa";
import fs from "fs-extra";
import path from "path";
import ora from "ora";
import { fileURLToPath } from "url";

// ✅ Fix for Node 22+ JSON import
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgPath = path.join(__dirname, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

const banner = () => {
  const text = figlet.textSync("NEXT VAULT", { horizontalLayout: "full" });
  console.log(gradient.pastel.multiline(text));
  console.log(chalk.gray("A blazing-fast Next.js starter generator ⚡\n"));
};

const createApp = async () => {
  banner();

  const { projectName, withShadcn, withTheme, withMotion, initGit } =
    await inquirer.prompt([
      {
        name: "projectName",
        message: chalk.cyan("📁  Project name:"),
        default: "my-next-app",
      },
      {
        name: "withShadcn",
        type: "confirm",
        message: chalk.yellow("🧱  Add shadcn/ui components?"),
        default: true,
      },
      {
        name: "withTheme",
        type: "confirm",
        message: chalk.magenta("🌓  Add dark/light theme support?"),
        default: true,
      },
      {
        name: "withMotion",
        type: "confirm",
        message: chalk.blue("💫  Add framer-motion animations?"),
        default: false,
      },
      {
        name: "initGit",
        type: "confirm",
        message: chalk.green("🪄  Initialize git repository?"),
        default: true,
      },
    ]);

  const spinner = ora("🚀 Creating Next.js project...").start();

  try {
    await execa(
      "npx",
      ["create-next-app@latest", projectName, "--typescript"],
      { stdio: "inherit" }
    );
    spinner.succeed(chalk.green("✅ Next.js project created."));
  } catch (err) {
    spinner.fail("❌ Error creating project");
    console.error(err);
    process.exit(1);
  }

  const cwd = path.join(process.cwd(), projectName);

  spinner.start("🎨 Installing Tailwind CSS...");
  try {
    await execa(
      "npm",
      ["install", "-D", "tailwindcss", "postcss", "autoprefixer"],
      { cwd, stdio: "inherit" }
    );
    await execa("npx", ["tailwindcss", "init", "-p"], {
      cwd,
      stdio: "inherit",
    });
    spinner.succeed("🎨 TailwindCSS installed.");
  } catch (err) {
    spinner.fail("❌ Tailwind setup failed.");
    console.error(err);
  }

  // install extras
  const extras = [];
  if (withShadcn) extras.push("@shadcn/ui", "lucide-react");
  if (withTheme) extras.push("next-themes");
  if (withMotion) extras.push("framer-motion");

  if (extras.length > 0) {
    spinner.start("🧩 Installing extra dependencies...");
    try {
      await execa("npm", ["install", ...extras], { cwd, stdio: "inherit" });
      spinner.succeed("🧩 Extra dependencies installed.");
    } catch (err) {
      spinner.fail("❌ Failed to install extra dependencies.");
      console.error(err);
    }
  }

  // Add Tailwind base setup
  const globals = `
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom Theme Base */
:root {
  --brand: #2563eb;
}
`;
  await fs.ensureDir(path.join(cwd, "styles"));
  await fs.writeFile(path.join(cwd, "styles", "globals.css"), globals);

  // Modify tailwind config
  const tailwindConfig = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: { extend: {} },
  plugins: []
}
`;
  await fs.writeFile(path.join(cwd, "tailwind.config.js"), tailwindConfig);

  // Optional theme setup
  if (withTheme) {
    const themeFile = `
"use client";
import { ThemeProvider } from "next-themes";

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
`;
    await fs.ensureDir(path.join(cwd, "app"));
    await fs.writeFile(path.join(cwd, "app", "providers.tsx"), themeFile);
  }

  // Git init
  if (initGit) {
    spinner.start("🪄 Initializing git...");
    try {
      await execa("git", ["init"], { cwd });
      await execa("git", ["add", "."], { cwd });
      await execa(
        "git",
        ["commit", "-m", "chore: initial commit from create-next-vault"],
        { cwd }
      );
      spinner.succeed("🪄 Git repository initialized.");
    } catch {
      spinner.warn("⚠️ Git setup skipped.");
    }
  }

  console.log(
    chalk.greenBright(`
✅  Project "${projectName}" created successfully!

Next steps:
  cd ${projectName}
  npm run dev

✨  ${chalk.cyan("Happy hacking with Next Vault!")}
`)
  );
};

createApp();
