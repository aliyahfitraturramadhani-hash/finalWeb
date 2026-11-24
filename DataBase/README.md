# BOOKLYN – Database Documentation

## 1. Project Overview

BOOKLYN is a Library Management System designed to manage library operations, including book catalog management, membership, borrowing, returns, fines, reviews, announcements, and loan extensions.

The database uses PostgreSQL as its relational database management system.

## 2. Database Technology

- Database Management System: PostgreSQL
- Database Administration Tool: pgAdmin 4
- Query Language: SQL
- Database Type: Relational Database

## 3. Database Structure

The database consists of 11 main tables.

### Core Tables

| No. | Table Name | Description |
|---|---|---|
| 1 | users | Stores user accounts and authentication information |
| 2 | members | Stores library membership information |
| 3 | categories | Stores book categories |
| 4 | books | Stores book information and metadata |
| 5 | book_copies | Stores individual physical book copies |
| 6 | loans | Stores borrowing transactions |
| 7 | loan_items | Stores books included in borrowing transactions |
| 8 | fines | Stores library fines |
| 9 | reviews | Stores member reviews and ratings |

### Additional Tables

| No. | Table Name | Description |
|---|---|---|
| 10 | announcements | Stores library announcements |
| 11 | extension_requests | Stores loan extension requests |

## 4. Database Files

| File | Description |
|---|---|
| booklyn.sql | Creates the nine core tables and inserts initial data |
| 02_additional_tables.sql | Creates announcements and extension_requests tables |
| 03_seed_books.sql | Inserts 25 book records and creates 50 book copies |

## 5. Book Categories

The database initially provides five categories:

| ID | Category |
|---|---|
| 1 | Fiksi |
| 2 | Non-Fiksi |
| 3 | Sains dan Teknologi |
| 4 | Sejarah |
| 5 | Anak dan Remaja |

## 6. Book Inventory

The initial book inventory contains:

- 25 book titles
- 2 physical copies per title
- 50 total book copies
- Initial copy condition: baik
- Initial copy status: tersedia

Each physical copy has a unique inventory code.

Example:

- BKL-0001-01
- BKL-0001-02

## 7. Database Relationships

The database uses primary keys and foreign keys to maintain relational integrity.

Main relationships:

- users → members
- categories → books
- books → book_copies
- members → loans
- loans → loan_items
- book_copies → loan_items
- loan_items → fines
- loan_items → reviews
- users → announcements
- loans → extension_requests
- members → extension_requests

## 8. Installation and Execution

For a new and empty database, execute the SQL files in the following order:

1. booklyn.sql
2. 02_additional_tables.sql
3. 03_seed_books.sql

The SQL files can be executed through pgAdmin Query Tool or PostgreSQL command-line tools.

IMPORTANT:

The main file booklyn.sql contains DROP TABLE statements for development reset purposes. Running it again will delete and recreate the core tables and their data.

Do not execute booklyn.sql on an existing database containing important data unless a full reset is intentionally required.

For the existing BOOKLYN database, only execute the additional tables file if those tables do not already exist, followed by the book seed file.

## 9. Database Verification

After executing the seed file, verify the inventory using:

```sql
SELECT COUNT(*) AS total_buku
FROM books
WHERE deleted_at IS NULL;

SELECT COUNT(*) AS total_eksemplar
FROM book_copies;
```

Expected initial inventory:

| Data | Expected Total |
|---|---:|
| Books | 25 |
| Book Copies | 50 |

## 10. Notes

- The database stores physical printed books.
- Book covers are stored in the project's public/images/books directory.
- The database stores cover paths, not image files.
- Library employees handle physical book handovers and returns.
- Fine payments are handled directly at the library.
- The database uses foreign keys and constraints to maintain data consistency.

---

BOOKLYN – Library Management System  
Database Documentation