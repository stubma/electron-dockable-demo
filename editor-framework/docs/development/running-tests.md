# Running Tests

To test the Editor-Framework itself, just run:

```bash
npm test [./your/test/file] -- [options]

## or

npm start ./test -- test ./your/test/file [options]
```

You can also run a single test or multiple tests in one directory by:

```bash
npm test ${your/test/path}
```

You can also force to run tests in renderer by `--renderer` option:

```bash
npm test ${your/test/path} -- --renderer
```

You can load specific package and run its tests by `--package` option:

```bash
npm test ${your/test/path} -- --package
```

To debug a test, use `--detail` option:

```bash
npm test ${your/test/path} -- --detail
```

To change reporter, use `--reporter name` option:

```bash
npm test ${your/test/path} -- --reporter classic
```
