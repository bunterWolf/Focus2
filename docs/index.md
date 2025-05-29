# Workmory Documentation

Welcome to the Workmory documentation. This index provides an overview of all available documentation files.

## System Documentation

- [Engineering Design Document](./engineering-design.md) - Detailed technical documentation about the application architecture, components, and data flow.
- [User Requirements](./user-requirements.md) - Core user requirements and feature specifications.

## Development Guides

- [Release Process](./release-process.md) - Instructions for creating and publishing production releases.
- [Beta Release Process](./beta-release-process.md) - Procedure for managing beta releases and collecting feedback.

## Architecture Overview

Workmory follows a modular architecture with these main components:

1. **Activity Core** - Central data structures and interfaces
2. **Activity Capture** - Components for tracking user activity
3. **Activity Storage** - Persistence and data management
4. **Activity Analysis** - Data processing and aggregation
5. **Activity UI** - User interface components

The application uses the Electron framework with separate main and renderer processes, communicating via IPC mechanisms.

## Getting Started

For developers getting started with the codebase, we recommend:

1. Read the [Engineering Design Document](./engineering-design.md) for a high-level overview
2. Review the [User Requirements](./user-requirements.md) to understand core functionality
3. Set up your development environment following the README in the root directory
4. Use the mock data mode for quick testing and development

## Contributing

When contributing to Workmory, please:

1. Follow our coding conventions and architecture principles
2. Write tests for new functionality
3. Document significant changes
4. Follow the release processes for shipping changes

## Additional Resources

- Project README in the root directory
- Inline code documentation
- GitHub repository issues and pull requests 