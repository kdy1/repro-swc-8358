## Running swc on multiple folders in a monorepo workspace

In this monorepo there is a single `backend` project. It consists of 3 "root" folders:

- `integration-tests`
- `generated`
- `src`

The goal is to transpile all 3 folders (even though `integration-tests` is not actually necessary
for the app to run) with a single command.

When you run `"compile:tsc"` (`tsc -b`) script in the `package/backend` workspace, it produces the `.js` output
in an analogous structure of the `package/backend` folder, nested inside `dist`:

```
$ tree -L 2 dist
dist
├── generated
│   └── some-api
├── integration-tests
│   ├── one.d.ts
│   └── one.js
├── src
│   ├── main.d.ts
│   ├── main.js
│   ├── service-A
│   └── service-B
└── tsconfig.tsbuildinfo
```

I want to achieve the same result with swc. But it turns out that `swc . -d dist` does not work
at all. I tried to come up with various different ways that could work. I've listed them below.

## Different approaches

- `"compile:swc:inner:relative"` (`swc . -d dist`)

  ❌ This is the most natural way of running the command, but it does not generate any output.

- `"compile:swc:outer:relative"` (`cd ..; swc backend -d backend/dist --config-file backend/.swcrc`)

  ✅ Generates correct output.

- `"compile:swc:outer:absolute"` (`cd ..; swc $PWD -d $PWD/dist --config-file $PWD/.swcrc`)

  ✅ Generates correct output.

- `"compile:swc:inner:absolute"` (`"swc $PWD -d $PWD/dist --config-file $PWD/.swcrc"`)

  ❌ Generates a malformed (flattened) directory structure.

  ```
  $ tree -L 2 dist

  dist
  ├── main.js
  ├── main.js.map
  ├── one.js
  ├── one.js.map
  ├── service-A
  │   ├── a.js
  │   └── a.js.map
  ├── service-B
  │   ├── b.js
  │   └── b.js.map
  └── some-api
    ├── api.js
    └── api.js.map

  3 directories, 10 files
  ```

- `"compile:swc:inner:separate"` (`swc src -d dist/src & swc generated -d dist/generated & swc integration-tests -d dist/integration-tests`)

  ✅ Generates correct output.

The "outer" commands look like a hack. When working in a monorepo like this one, it is required
to use the top-level `swc` packages, cause `yarn` will not let you run backend's copy of `swc` from an outer directory.
This means that you cannot use the `devDependency` of a package to build it, you need to rely on external
tools, which is not as portable as I'd like it to be.

The "inner" commands do not work correctly. The relative version is what I'd suppose to be the correct
usage of the CLI, but it does not produce any output. What's also weird is that providing
the same absolute paths as for the "outer absolute" script generates a different output when run inside
the workspace folder.

Running 3 separate commands for each of the root folders provides a correct output, but it requires
listing the folders manually. You cannot combine such script with a flag like `--watch` by appending
the flag, because it will be only applied to the last command.
