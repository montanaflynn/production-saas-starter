# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AP-Cash Frontend** - A radically simplified, advice-only accounts payable assistant. Built with minimal Next.js 15 App Router for maximum maintainability and performance.

## Development Commands

- **Development**: `pnpm dev` (uses Turbopack)
- **Build**: `pnpm build` 
- **Production**: `pnpm start`
- **Lint**: `pnpm lint`
- **Package Manager**: `pnpm` only

## Tech Stack & Architecture

- **Framework**: Next.js 15 + App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui for consistent, accessible UI components
- **State Management**: Zustand for global state, React built-ins for local state
- **Philosophy**: Modern, maintainable, performant

## Key Principles

- **Modern Simplicity**: Use proven, well-established tools that enhance developer experience
- **Performance First**: Optimized bundle size and fast load times
- **Maintainable**: Easy to understand, modify, and scale
- **Consistent**: shadcn/ui components for design system consistency
- **Type Safe**: Strict TypeScript throughout the application

## Project Structure

```
app/
├── layout.tsx          # Root layout
├── page.tsx           # Homepage
├── globals.css        # Tailwind imports
└── (routes)/          # App routes

components/
├── ui/                # shadcn/ui components
└── custom/            # Custom components

lib/
├── utils.ts           # Utility functions
└── cn.ts              # Class name utility

stores/
└── (zustand stores)   # Global state management
```

## Current State

- **Modern tech stack** with carefully selected, industry-standard tools
- **Type-safe** development with strict TypeScript
- **Component-driven** architecture with shadcn/ui
- **Optimized performance** with Next.js 15 and efficient state management

## Development Guidelines

- **Components**: Use shadcn/ui for UI components, create custom components when needed
- **State Management**: Use Zustand for global state, React built-ins for local component state
- **Styling**: Tailwind CSS for all styling, follow design system patterns
- **Type Safety**: Maintain strict TypeScript throughout the codebase
- **Dependencies**: Add thoughtfully - prioritize well-maintained, widely-adopted packages

## Before Adding Any Package

1. Ask: "Does this solve a real problem better than existing solutions?"
2. Check: "Is this package well-maintained and widely adopted?"
3. Verify: "Does this align with our tech stack and architecture?"
4. Consider: "What's the bundle size impact and maintenance overhead?"

## Setup Instructions

### shadcn/ui Setup
```bash
npx shadcn@latest init
npx shadcn@latest add button card input
```

### Zustand Installation
```bash
pnpm add zustand
```

## Key Files

- **docs/PROJECT.md** - Business requirements and feature spec
- **package.json** - Project dependencies and scripts
- **tailwind.config.ts** - Tailwind configuration with design tokens
- **components.json** - shadcn/ui configuration
- **lib/utils.ts** - Shared utility functions and cn() helper

## Architecture Notes

- **Components**: shadcn/ui provides accessible, well-tested base components
- **State**: Zustand offers simple, boilerplate-free global state management
- **Styling**: Tailwind CSS with consistent design tokens and utility classes
- **Types**: Strict TypeScript ensures code reliability and developer experience

The goal is to build modern, maintainable web apps using industry-standard tools that enhance productivity without unnecessary complexity.