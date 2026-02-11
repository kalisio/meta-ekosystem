# meta-ekosystem

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Latest Release](https://img.shields.io/github/v/tag/kalisio/meta-ekosystem?sort=semver&label=latest)](https://github.com/kalisio/meta-ekosystem/releases)
[![Download Status](https://img.shields.io/npm/dm/@kalisio/meta-ekosystem.svg?style=flat-square)](https://www.npmjs.com/package/@kalisio/meta-ekosystem)

> Kalisio's meta-repo for sharing tools, configurations, and conventions

This package centralizes common development resources used across Kalisio projects, including:
- A meta package catalog for ecosystem managment
- Various scripts to be included in monorepo projects that includes this meta-repo
- Various code genertors to help creating monorepo projects
- Common conventions 

> [!IMPORTANT]  
> Before getting started, make sure you have the following prerequisites installed:
> - [Node.js](https://nodejs.org/) >= 20
> - [pnpm](https://pnpm.io/) >= 10

## Usage

### Installation

``` bash
pnpm add @kalisio/meta-ekosystem
```

### Commands

The commands are intended to be used by monorepo projects that depend on this repository.

#### k-sync-catalog

* Decription

It synchronizes your project catalog by merging the meta `catalog.json` with an existing local catalog file and updating the catalog property in `pnpm-workspace.yaml`.

* Usage

```bash
pnpm k-sync-catalog"
```

#### k-init-docs

* Description

It generates a complete [VitePress](https://vitepress.dev/) documentation skeleton in a `docs/` directory.

* Usage

```bash
pnpm k-init-docs
```

#### k-gen-docs

It generates [VitePress](https://vitepress.dev/)-compatible Markdown documentation from JSDoc comments by scanning monorepo packages and rendering them using [Handlebars template](./templates/jsdoc2md/jsdoc2md.hbs) into a `docs/` directory.

* Usage

```bash
pnpm k-gen-docs
```

## Contributing

### Guidelines

Found a bug ? Missing a Feature ? Want to contribute ? check out our [contribution guidelines](./CONTRIBUTING.md) for details.

### Development

#### Setup

```bash
# Clone the repository
git clone https://github.com/kalisio/meta-ekosystem.git
cd meta-ekosystem

# Install dependencies
pnpm install
```

#### Linking locally

This repository provides global binaries to help manage the monorepo ecosystem. During development, you will often need to link this package to other projects to test the features you are working on.

If you're working on multiple packages simultaneously:

```bash
# In meta-ekosystem directory
pnpm link --global

# In your project directory
pnpm link --global @kalisio/meta-ekosystem
```

Or for a direct local link:

```bash
# In your project directory
pnpm link ../path/to/meta-ekosystem
```

## License

Licensed under the [MIT license](LICENSE).

Copyright (c) 2026 [Kalisio](https://kalisio.com)

[![Kalisio](https://kalisio.github.io/kalisioscope/kalisio/kalisio-logo-black-256x84.png)](https://kalisio.com)
