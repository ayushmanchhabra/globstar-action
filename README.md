# globstar-action

A GitHub Action for [DeepSourceCorp/globstar](https://github.com/DeepSourceCorp/globstar/).

```yaml
- name: Setup Globstar
  uses: ayushmanchhabra/globstar-action@v0
```

## Inputs

### version

**Optional** The version to download. Defaults to `latest`. Please consult [globstar releases](https://github.com/DeepSourceCorp/globstar/releases) for specific versions.

```yaml
- name: Setup Globstar
  uses: ayushmanchhabra/globstar-action@v0
  with:
    version: 'latest'
```

```yaml
- name: Setup Globstar
  uses: ayushmanchhabra/globstar-action@v0
  with:
    version: 'v0.1.1'
```

### auth-token

**Optional** The authentication token to use. Defaults to `github.token`.

```yaml
- name: Setup Globstar
  uses: ayushmanchhabra/globstar-action@v0
  with:
    auth-token: ${{ secrets.GITHUB_TOKEN }}
```

## Contributing

### Testing

1. In `.github/workflows/ci.yml`, change the `main` branch to your pull request's branch's name.
1. Always `npm run dist` before making a Git commit.
1. Change the branch name back to `main` after testing is complete..