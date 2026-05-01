# meta-ekosystem

[![Latest Release](https://img.shields.io/github/v/tag/kalisio/meta-ekosystem?sort=semver&label=latest)](https://github.com/kalisio/meta-ekosystem/releases)
[![Download Status](https://img.shields.io/npm/dm/@kalisio/meta-ekosystem.svg?style=flat-square)](https://www.npmjs.com/package/@kalisio/meta-ekosystem)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


_Kalisio's meta-repo for sharing tools, configurations, and conventions_

---

This repository centralizes common development resources used across Kalisio projects, including:
- A meta package catalog for ecosystem management
- Various scripts to be included in monorepo projects that includes this meta-repo
- Various code generators to help creating monorepo projects
- Common conventions

> [!IMPORTANT]
> Before getting started, make sure you have the following prerequisites installed:
> - [Node.js](https://nodejs.org/) >= 20
> - [pnpm](https://pnpm.io/) >= 10

## Usage

### Installation

``` bash
git clone https://github.com/kalisio/meta-ekosystem
cd meta-ekosystem
pnpm install
pnpm link --global
```

### Resources

#### Catalog

The [`catalog.json`](./catalog.json) file, also referred to as the **meta-catalog**, centralizes and maintains the list of all dependencies, along with their respective versions, to ensure consistency and alignment across the **Kalisio** ecosystem.

> [!TIP]
> Use the [k-sync-catalog](#k-sync-catalog) commands to keep your local catalog synchronized with this meta-catalog.

### Commands

The commands are intended to be used by monorepo projects that depend on this repository.

>[!TIP]
> To run a command from this repository, use:
> `node ./bin/<command>`

#### k-init-monorepo

##### Description

It generates a **monorepo** skeleton with the following structure:

```
monorepo
├── docs
│   ├── index.md.hbs
│   ├── overview
│   │   ├── about.md.hbs
│   │   ├── changelog.md
│   │   ├── contact.md
│   │   ├── contributing.md.hbs
│   │   ├── license.md
│   │   └── roadmap.md.hbs
│   └── package.json
├── LICENSE.md
├── lint-staged.config.mjs
├── package.json.hbs
├── pnpm-workspace.yaml.hbs
├── README.md.hbs
├── sonar-project.properties.hbs
├── vite.base-config.js
└── vitest.base-config.js
```

##### Usage

```bash
pnpm k-init-monorepo
```

>[!NOTE]
> You will be prompted for the repository `name` and `path`.

#### k-init-package

##### Description

It generates a **package** skeleton with the following structure:

```
package
├── LICENSE.md
├── package.json
├── README.md
├── vite.config.js
└── vitest.config.js
```

It adds the following scripts to the parent monorepo's `package.json`:

| Script | Description |
|---|---|
| `build:<package>` | Build the package |
| `lint:<package>`  | Lint the package  |
| `test:<package>`  | Run the package tests |

The command also updates the documentation configuration accordingly:
- adds an entry to the `packages.json` file, which is used to generate the documentation
- creates a new folder in the packages directory containing an `index.md` file

##### Usage

>[!IMPORTANT]
> Run this command from the root directory of your monorepo.

```bash
cd path/to/<my-monorepo>
pnpm k-init-package
```

You will be prompted to enter the package `name` and `description`.

#### k-init-example

##### Description

It generates an **example** skeleton with the following structure:

```
package
├── LICENSE.md
├── package.json
├── README.md
└── vite.config.js
```

##### Usage

>[!IMPORTANT]
> Run this command from the root directory of your monorepo.

```bash
cd path/to/<my-monorepo>
pnpm k-init-example
```

You will be prompted to enter the example `name`.

>[!IMPORTANT]
> The `name` is used to declare the dependency on the package named `@kalisio/<name>`

#### k-sync-catalog

##### Description

It synchronizes your project catalog by merging the **meta-catalog** with an existing local catalog file and updating
the catalog property in `pnpm-workspace.yaml`.

<div align="center">
  <img src="./docs/k-sync-catalog.png" alt="k-sync-catalog" width="400"/>
</div>

##### Usage

>[!IMPORTANT]
> Run this command from the root directory of your monorepo.

```bash
cd path/to/<my-monorepo>
pnpm k-sync-catalog
```

## Contributing

### Guidelines

Found a bug ? Missing a feature ? Want to contribute ? Please refer to our [contribution guidelines](./docs/CONTRIBUTING.md)
for details.

### Linting

```bash
# In the meta-ekosystem directory
pnpm lint
```

> [!NOTE]
> This repository follows the [standardJS](https://standardjs.com/) style guide for linting and code consistency.
> By default, **standard** is called with the `--fix` option to automatically fix style issues before committing.

### Versioning

Create changesets as needed during the development phase using:

```bash
pnpm change
```

> [!NOTE]
> It is recommended to create a changeset for each significant commit, e.g., a fix or feat.

Then update the **version** using:

```bash
pnpm version
```

And commit the changes:

```bash
git add .
git commit -m "chore: released <new version>"
git push
```

### Publishing

To publish this package to [NPM](https://www.npmjs.com/), use:

```bash
pnpm publish
git push --follow-tags
```

> [!NOTE]
> When publishing a tag will be created corresponding to the **version** defined in the `package.json`

## License

Licensed under the [MIT License](LICENSE).

Copyright (c) 2026 [Kalisio](https://kalisio.com)

[![Kalisio](https://kalisio.github.io/kalisioscope/kalisio/kalisio-logo-light-256x96.png)](https://kalisio.com)
