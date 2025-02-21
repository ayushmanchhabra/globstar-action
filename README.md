# globstar-action

A GitHub Action for [DeepSourceCorp/globstar](https://github.com/DeepSourceCorp/globstar/).

```yaml
uses: ayushmanchhabra/globstar-action@v0
```

## Inputs

### version

**Optional** The version to download. Defaults to `latest`. Please consult [globstart releases](https://github.com/DeepSourceCorp/globstar/releases) for specific versions.

```yaml
uses: ayushmanchhabra/globstar-action@v0
with:
    version: 'latest'
```

```yaml
uses: ayushmanchhabra/globstar-action@v0
with:
    version: 'v0.1.1'
```

### auth-token

**Optional** The authentication token to use. Defaults to `github.token`. You will need to specify an environment variable for this to work properly.

```yaml
env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

uses: ayushmanchhabra/globstar-action@v0
with:
    auth-token: ${{ GITHUB_TOKEN }}
```
