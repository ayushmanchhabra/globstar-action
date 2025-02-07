# globstar-action

A GitHub Action for DeepSourceCorp/globstar

```yaml
env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

uses: ayushmanchhabra/globstar-action@v0.2.1
with:
    version: 'latest'
```

## Inputs

### Version

**Required** The version to download. Defaults to `latest`.
## Outputs

### Version

The version downloaded.
