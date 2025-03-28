# Macrometa Public Scripts

This repository contains a collection of public scripts designed to help clients interact with and manage their Macrometa environment. Each script addresses a common need—from migrating accounts and cloning collections to handling large document queries and ensuring regional acknowledgments.

## Table of Contents

- [Overview](#overview)
- [Scripts](#scripts)
  - [accountMigration](#accountmigration)
  - [cloneCollection](#clonecollection)
  - [cloneFabric](#clonefabric)
  - [exportQueryWorkers](#exportqueryworkers)
  - [returningMoreThan1000doc](#returningmorethan1000doc)
  - [tempBackup](#tempbackup)
  - [waitForACK](#waitforack)
  - [waitForACK-StreamWorkers](#waitforack-streamworkers)
- [Prerequisites](#prerequisites)
- [Usage](#usage)
- [Development](#development)
- [Support](#support)
- [License](#license)
- [Code of Conduct](#code-of-conduct)

## Overview

Macrometa's global data mesh platform enables high-performance, real-time data management across regions. This repository provides a set of scripts that simplify common tasks when working with Macrometa, such as account migrations, cloning collections or geo fabrics, exporting query workers, backing up configurations, and managing acknowledgments across regions.

## Scripts

### accountMigration
- **Purpose:** Migrates an account from one feed to another.
- **Details:** Use this script to seamlessly transfer account data without manual intervention.

### cloneCollection
- **Purpose:** Clones collections from one account/fabric to another.
- **Details:** Ideal for replicating collection configurations across different environments.

### cloneFabric
- **Purpose:** Clones a geo fabric.
- **Details:** Simplifies the process of duplicating geo fabric setups in various locations.

### exportQueryWorkers
- **Purpose:** Exports all query workers from your Macrometa account.
- **Details:** Generates an export file containing query worker configurations for backup or migration.

### returningMoreThan1000doc
- **Purpose:** Returns documents in batches to work around Macrometa's 10k document limit.
- **Details:** Use this script when querying large datasets to avoid hitting the limit.

### tempBackup
- **Purpose:** Exports all data and configurations as JSON.
- **Details:** A temporary backup solution to capture your current Macrometa setup.

### waitForACK
- **Purpose:** Ensures that you receive acknowledgments (ACK) from all regions before continuing.
- **Details:** Helps maintain data consistency and regional synchronization.

### waitForACK-StreamWorkers
- **Purpose:** Similar to waitForACK, but specifically tailored for stream worker processes.
- **Details:** Waits for ACKs in stream worker operations to ensure reliable processing.

## Prerequisites

- **Macrometa Account:** You must have an active Macrometa account. [Sign up here](https://www.macrometa.com) if needed.
- **Environment Setup:** Depending on the script:
  - **Node.js Scripts:** Install Node.js.
- **Dependencies:** Check each script for any additional dependency requirements and install them accordingly (e.g., using `npm`).

## Usage

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourusername/accountMigration.git
   cd accountMigration
   ```

2. **Configure the Scripts:**

   Modify configuration settings or environment variables as needed.

   For scripts that require environment variables (e.g., API keys, fabric names), create a `.env` file in the script directory with the appropriate values.

3. **Run the Scripts:**

   - **Node.js Scripts:**
     ```bash
     node app.js
     ```

   Refer to the inline comments and documentation within each script for more detailed usage instructions.

## Development

- **Testing:** Some scripts may include tests or sample usage. Refer to any test files or inline comments for guidance.
- **Contributing:** Contributions are welcome! Please fork the repository and submit a pull request with your enhancements.
- **Pre-commit Hooks:** If applicable, set up pre-commit hooks to maintain code quality. Instructions for installing pre-commit can be added here if used.

## Support

If you run into issues or have any questions about these scripts, please reach out to Macrometa support at [support@macrometa.com](mailto:support@macrometa.com).

## License

This project is distributed under the Apache License 2.0. See the LICENSE file for more details.

## Code of Conduct

By contributing to this repository, you agree to abide by our Code of Conduct. Please report any unacceptable behavior to [product@macrometa.com](mailto:product@macrometa.com).
