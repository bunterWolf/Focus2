# Release Process

This document describes the release process for Workmory.

## Prerequisites

- Node.js (v14+)
- npm
- Access to GitHub repository
- Code signing certificates (for production releases)

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes
- **Pre-release** versions with `-beta.X` suffix for beta releases

## Standard Release Process

### 1. Prepare Release

1. Ensure all desired changes are merged to `main` branch
2. Run tests to verify functionality
   ```bash
   npm test
   ```
3. Update version in `package.json` using:
   ```bash
   npm version patch|minor|major
   ```
   This will:
   - Update version in package.json
   - Create a git tag
   - Commit the changes

4. Push changes including tags:
   ```bash
   git push --follow-tags
   ```

### 2. Build Release Artifacts

1. Clean the workspace
   ```bash
   npm run clean
   ```

2. Build the application for all platforms
   ```bash
   npm run dist
   ```
   This creates installers in the `release` directory.

3. Verify artifacts
   - Test installers on respective platforms
   - Verify auto-update files (`latest.yml`, `latest-mac.yml`)

### 3. Publish Release

1. Create a new release on GitHub
   - Use the tag created earlier
   - Write release notes detailing changes
   - Upload build artifacts from `release` directory

2. Announce the release
   - Update website
   - Notify existing users through in-app notification

## Automated Release via GitHub Actions

For convenience, we have automated the release process:

1. Run the release script:
   ```bash
   npm run release
   ```

2. The script will:
   - Update version numbers
   - Create and push tags
   - Trigger GitHub Actions workflow

3. The GitHub Actions workflow will:
   - Build for all platforms
   - Create GitHub release
   - Upload artifacts
   - Generate release notes

## Hotfix Releases

For urgent fixes to production:

1. Create hotfix branch from the release tag
   ```bash
   git checkout -b hotfix/v1.x.y v1.x.y
   ```

2. Make necessary fixes

3. Test thoroughly

4. Bump patch version
   ```bash
   npm version patch
   ```

5. Push and follow standard release steps
   ```bash
   git push --follow-tags
   ```

6. After release, merge changes back to main
   ```bash
   git checkout main
   git merge hotfix/v1.x.y
   git push
   ```

## Post-Release

1. Monitor error reporting for 48 hours
2. Verify auto-update functionality
3. Update documentation if needed 