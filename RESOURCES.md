# PostgreSQL / SQL Resources

Curated, high-trust sources. Knowledge in lessons is drawn from here, not from memory.

## Knowledge

- [PostgreSQL Official Documentation — Tutorial & SQL Language](https://www.postgresql.org/docs/current/tutorial.html)
  Primary source of truth for Postgres behaviour and syntax. Use for: exact semantics of any clause, function reference, `NULL` rules, data types. When in doubt, this wins.
- [PostgreSQL Docs — Functions and Operators](https://www.postgresql.org/docs/current/functions.html)
  Canonical list of string/date/aggregate/window functions. Use for: "what function do I need and what does it return".
- [PostgreSQL Docs — Window Functions Tutorial](https://www.postgresql.org/docs/current/tutorial-window.html)
  Official, concise intro to `OVER`/`PARTITION BY`. Use for: the window-functions module.
- [PostgreSQL Exercises — pgexercises.com](https://pgexercises.com/)
  Free graded exercises on one dataset (a country club): SELECT → joins → aggregation → dates → recursion/CTE/windows. Use for: extra reps beyond this course's built-in exercises; the difficulty ramp is excellent.
- [Mode SQL Tutorial (Basic → Intermediate → Advanced)](https://mode.com/sql-tutorial/)
  Very readable, example-driven, in-browser practice. Use for: a second explanation of joins, subqueries, window functions when mine doesn't click.
- [Use The Index, Luke! — Markus Winand](https://use-the-index-luke.com/)
  The definitive developer-focused guide to SQL indexing & performance (covers Postgres). Use for: the indexes / `EXPLAIN` / performance module. Read `The WHERE Clause` and `Anatomy of an SQL Index` first.
- [SQL Cookbook, 2nd ed. — Anthony Molinaro & Robert de Graaf (O'Reilly)](https://www.oreilly.com/library/view/sql-cookbook-2nd/9781492077435/)
  Problem→recipe reference. Use for: "how do I express this pattern in SQL" (pivoting, gaps-and-islands, running totals).
- [Crunchy Data — Postgres Tutorials & Playground](https://www.crunchydata.com/developers/tutorials)
  In-browser Postgres, strong articles on window functions/CTEs by Postgres people. Use for: deeper Postgres-specific patterns.
- [Документация PostgreSQL на русском — postgrespro.ru](https://postgrespro.ru/docs/postgresql)
  Полный официальный перевод документации Postgres на русский от Postgres Professional. Use for: когда английская формулировка в docs мешает понять смысл — читай тот же раздел здесь.

## Wisdom (Communities)

- [r/PostgreSQL](https://www.reddit.com/r/PostgreSQL/)
  Active Postgres-specific community. Use for: "is this the idiomatic Postgres way?", schema/design sanity checks.
- [r/SQL](https://www.reddit.com/r/SQL/)
  Broader SQL Q&A and learning. Use for: query-writing feedback, career/interview questions.
- [DBA Stack Exchange — postgresql tag](https://dba.stackexchange.com/questions/tagged/postgresql)
  High-signal, expert answers on query behaviour, performance, locking. Use for: precise "why does Postgres do X" questions after you've tried it yourself.
- [PostgreSQL Mailing Lists — pgsql-novice & pgsql-general](https://www.postgresql.org/list/)
  Direct line to the Postgres community, including core people. Use for: authoritative answers when SO/Reddit disagree.

## Gaps
- Нет практики под таймер для собеседований (не входит в текущую миссию). Если миссия сместится к интервью — добавить сюда DataLemur / StrataScratch.
