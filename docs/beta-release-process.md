# Beta Release Process

This document describes the beta release process for Workmory.

## Prerequisites

- Completed feature development
- Basic internal testing
- Beta testers group established

## Beta Release Workflow

### 1. Prepare Beta Release

1. Ensure all desired features are merged to `develop` branch
2. Run tests to verify functionality
   ```bash
   npm test
   ```
3. Update version in `package.json` with beta tag using:
   ```bash
   npm version prerelease --preid=beta
   ```
   This will:
   - Update version to something like `1.2.3-beta.0`
   - Create a git tag
   - Commit the changes

4. Push changes including tags:
   ```bash
   git push --follow-tags
   ```

### 2. Build Beta Artifacts

1. Clean the workspace
   ```bash
   npm run clean
   ```

2. Build the application with beta configuration
   ```bash
   npm run dist:beta
   ```
   This creates installers in the `release` directory with beta configuration.

3. Verify beta artifacts
   - Test installers on respective platforms
   - Verify that installers have beta update channel configured

### 3. Publish Beta Release

1. Create a new pre-release on GitHub
   - Use the beta tag created earlier
   - Clearly mark as BETA in release notes
   - Detail new features and known issues
   - Upload build artifacts from `release` directory

2. Notify beta testers
   - Send email to beta tester group
   - Update beta testing channel in Discord/Slack

## Automated Beta Release

For convenience, we have automated the beta release process:

1. Run the beta release script:
   ```bash
   npm run release:beta
   ```

2. The script will:
   - Update version numbers with beta tag
   - Create and push tags
   - Trigger GitHub Actions workflow for beta

3. The GitHub Actions workflow will:
   - Build for all platforms with beta configuration
   - Create GitHub pre-release
   - Upload artifacts
   - Generate release notes

## Beta Testing Program

### Setting Up Beta Testers

Beta testers need to opt-in to receive beta updates through one of these methods:

1. **Environment Variable**:
   - Set `ALLOW_PRERELEASE=true` in the system environment
   - Restart the application

2. **Manual Installation**:
   - Download the beta installer from GitHub Pre-Releases
   - Install the beta version
   - The app will automatically update to newer beta versions

### Beta Tester Feedback

1. Collect feedback through:
   - GitHub Issues (with beta label)
   - Beta tester form
   - Direct communication channels

2. Prioritize and address critical issues

3. Consider releasing additional beta versions (beta.1, beta.2, etc.) for significant changes

## Moving from Beta to Production

When beta testing is successful:

1. Merge `develop` to `main`
   ```bash
   git checkout main
   git merge develop
   ```

2. Remove beta tag for production release
   ```bash
   npm version [patch|minor|major]
   ```

3. Follow the standard release process

## Notes

- Beta versions are clearly marked in the UI
- Only opted-in devices receive beta updates
- Beta releases are marked as pre-releases on GitHub
- Regular users won't see or receive beta updates
- You can release multiple beta versions (beta.1, beta.2, etc.) 