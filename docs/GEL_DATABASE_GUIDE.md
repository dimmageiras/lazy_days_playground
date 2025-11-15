# Gel Database Management Guide

This document provides comprehensive guidance for working with the Gel database in our development environment. From running migrations to accessing the admin interface, everything you need to manage your database effectively.

## Table of Contents

### 🗄️ [Database Overview](#database-overview)

### 🔧 [Database Operations](#database-operations)

### 🌐 [Admin Interface](#admin-interface)

### 🚀 [Type Generation](#type-generation)

### 🛠️ [Development Workflow](#development-workflow)

---

## Database Overview

Our project uses **Gel** (EdgeDB) as the primary database, running in a Docker container with the following configuration:

- **Database**: Gel (EdgeDB) v6+
- **Host**: `host.docker.internal:5656` (from dev container)
- **Security**: `insecure_dev_mode` for development
- **Authentication**: Username/password based

---

## Database Operations

### Schema Migrations

When you have schema changes in `dbschema/default.gel`, create and apply migrations from within the dev container:

**Create Migration:**

```bash
echo "password" | gel --host host.docker.internal --tls-security=insecure -P 5656 --password-from-stdin migration create
# Enter password: password
```

**Apply Migration:**

```bash
echo "password" | gel --host host.docker.internal --tls-security=insecure -P 5656 --password-from-stdin migrate
# Enter password: password
```

**Check Migration Status:**

```bash
echo "password" | gel --host host.docker.internal --tls-security=insecure -P 5656 --password-from-stdin migration status
# Enter password: password
```

### Database Queries

**Execute EdgeQL Queries:**

```bash
echo "password" | gel --host host.docker.internal --tls-security=insecure -P 5656 --password-from-stdin query "SELECT 1 + 1"
```

### Branch Management

**List All Branches:**

```bash
echo "password" | gel --host host.docker.internal --tls-security=insecure -P 5656 --password-from-stdin branch list
echo "password" | gel --host host.docker.internal --tls-security=insecure -P 5656 --password-from-stdin --branch BRANCH_NAME branch list
```

**Note:** When using remote connections (with `--host`), you must specify which branch context to use with the `--branch` flag. Replace `BRANCH_NAME` with an existing branch (e.g., `main` or `temp`).

**Create a Branch:**

```bash
echo "password" | gel --host host.docker.internal --tls-security=insecure -P 5656 --password-from-stdin --branch EXISTING_BRANCH branch create NEW_BRANCH_NAME
```

**Note:** When using remote connections, you must specify an existing branch context with `--branch` to create a new branch.

**Delete a Branch:**

```bash
echo -e "password\nYes" | gel --host host.docker.internal --tls-security=insecure -P 5656 --password-from-stdin branch drop BRANCH_NAME
```

**Note:** Branch deletion requires confirmation. The command above provides both the database password and the confirmation ("Yes") automatically.

```bash
echo "password" | gel --host host.docker.internal --tls-security=insecure -P 5656 --password-from-stdin --branch OTHER_BRANCH branch drop TARGET_BRANCH --non-interactive
```

**Important:** You cannot delete the currently active branch. To delete a branch, you must connect to a different branch using `--branch`. For example, to delete `main`, connect to `temp` first:

```bash
echo "password" | gel --host host.docker.internal --tls-security=insecure -P 5656 --password-from-stdin --branch temp branch drop main --non-interactive
```

---

## Admin Interface

### Accessing the Web UI

The Gel Admin Interface provides a powerful web-based tool for database management, query execution, and schema exploration.

**URL:** http://localhost:5656/ui

**Credentials:**

- **Username:** `admin`
- **Password:** `password`

### Features Available

- 🔍 **Schema Browser** - Explore your database structure
- ⚡ **Query Editor** - Write and execute EdgeQL queries with syntax highlighting
- 📊 **Data Explorer** - Browse and edit data with a visual interface
- 📈 **Performance Insights** - Monitor query performance and statistics
- 🔧 **Migration History** - View applied migrations and their details

---

## Type Generation

### Generating TypeScript Interfaces

Keep your TypeScript types in sync with your database schema using the automated generation tool.

**Generate Types:**

```bash
pnpm gel:generate
```

This command will:

- Connect to your database
- Introspect the current schema
- Generate TypeScript interfaces in `shared/types/generated`
- Include only your custom types (system types excluded for cleaner output)

**When to Regenerate:**

- After applying new migrations
- When schema changes are made
- Before starting new feature development

---

## Development Workflow

### Recommended Development Process

1. **📝 Schema Design**

   - Define your types in `dbschema/default.gel`
   - Use proper constraints and relationships

2. **🔄 Migration Creation**

   - Run migration create command
   - Review generated migration file
   - Apply migration to database

3. **🎯 Type Generation**

   - Run `pnpm gel:generate`
   - Verify generated TypeScript interfaces
   - Use types in your application code

4. **🧪 Testing**
   - Use Admin UI to test queries
   - Insert sample data for development
   - Verify constraints and relationships

### Best Practices

#### Schema Design

- **Use descriptive names** for types and properties
- **Apply proper constraints** (required, exclusive, etc.)
- **Plan relationships** carefully before implementation
- **Use enums** for predefined value sets

#### Migration Management

- **Review migrations** before applying to production
- **Never edit** applied migration files
- **Use descriptive commit messages** when migrations are added
- **Test migrations** on sample data first

#### Type Safety

- **Regenerate types** after schema changes
- **Use generated interfaces** instead of `any` types
- **Leverage TypeScript** for compile-time database validation

---

## Troubleshooting

### Common Issues

**Authentication Failed:**

- Verify container is running: `docker compose ps`
- Check password is correct: `password`
- Ensure using `host.docker.internal` from dev container

**Migration Conflicts:**

- Check migration status before creating new ones
- Ensure schema file matches database state
- Review migration history in Admin UI

**Connection Refused:**

- Restart database container: `docker compose restart gel_db`
- Verify port 5656 is accessible
- Check Docker networking configuration

### Getting Help

- 📚 **Official Documentation**: https://docs.geldata.com
- 🔧 **Admin UI**: Built-in help and query examples
- 🐛 **Debug Mode**: Add `--debug` flag to gel commands

---

## Configuration Reference

### Environment Variables

```bash
# Database connection (set in docker-compose.yaml)
EDGEDB_SERVER_PASSWORD=password
EDGEDB_SERVER_SECURITY=insecure_dev_mode
EDGEDB_SERVER_ADMIN_UI=enabled
```

### Connection String Format

```
gel://admin:password@host.docker.internal:5656/main?tls_security=insecure
```

---

_This guide is maintained for the lazy_days_playground development environment. Update as needed when configuration changes._
