```markdown
# CONTEXT.md

## Repository Overview
This repository (`Jashk120/test`) contains a collection of small, self-contained utility modules implemented in multiple programming languages. Each file provides basic operations ranging from data structures (queue), arithmetic, string manipulation, authentication, and API interaction. There are no inter-module dependencies; every file is independent.

## Architecture
The codebase is structured as a flat set of files with no overarching framework or build system. Each file serves as a standalone module exposing a set of related functions or a single class. The languages used are:

- **Java**: `Queue.java`
- **JavaScript**: `api.js`
- **Python**: `auth.py`, `utils.py`
- **C**: `calculator.c`
- **Rust**: `math.rs`
- **Go**: `strings.go`

No shared state or runtime coupling exists between files; they can be compiled/run individually.

## Modules

### `Queue.java`
- **Description**: A simple integer queue backed by a `LinkedList`.
- **Public Interface**:
  - `enqueue(int value)` – adds to the end.
  - `dequeue()` – removes and returns front element; throws `NoSuchElementException` if empty.
  - `isEmpty()` – checks emptiness.
- **Dependencies**: Java standard library (`java.util.LinkedList`).

### `api.js`
- **Description**: Functions to interact with a REST API for users.
- **Public Interface**:
  - `fetchUser(userId)` – async function that GETs `/api/users/{userId}` and returns the parsed JSON.
  - `createUser(name, email)` – async function that POSTs to `/api/users` with JSON body and returns the response.
- **Dependencies**: Browser/Node.js `fetch` API.

### `auth.py`
- **Description**: Password hashing and verification using SHA-256.
- **Public Interface**:
  - `hash_password(password)` – returns SHA-256 hex digest.
  - `verify_password(password, hashed)` – compares plain text against stored hash.
- **Notes**: Uses `hashlib` imported locally inside `hash_password`.

### `calculator.c`
- **Description**: Basic arithmetic functions.
- **Public Interface**:
  - `add(int a, int b)` – returns sum.
  - `subtract(int a, int b)` – returns difference.
  - `divide(int a, int b)` – returns float quotient; returns `-1.0f` if `b == 0` (sentinel value, not an exception).
- **Dependencies**: Standard C library (no external includes).

### `math.rs`
- **Description**: Mathematical utility functions.
- **Public Interface**:
  - `factorial(n: u64) -> u64` – recursive factorial; `0! = 1`.
  - `is_prime(n: u64) -> bool` – primality test via trial division up to sqrt(n).
- **Dependencies**: Rust standard library (`std`).

### `strings.go`
- **Description**: String manipulation functions.
- **Public Interface**:
  - `reverseString(s string) string` – reverses a string using runes (Unicode-aware).
  - `isPalindrome(s string) bool` – checks case‑insensitive palindrome.
- **Dependencies**: Go standard library (`strings`).

### `utils.py`
- **Description**: Basic numeric operations.
- **Public Interface**:
  - `add(a, b)` – returns sum.
  - `multiply(a, b)` – returns product.
  - `divide(a, b)` – returns float division; raises `ValueError` if `b == 0`.
- **Dependencies**: None.

## Setup Assumptions
- No build tools or package managers are required beyond the respective language compilers/interpreters.
- Each file can be compiled or run independently:
  - Java: `javac Queue.java`
  - JavaScript: can be imported/required in a Node.js environment or included in a browser.
  - Python: `python auth.py` (or import).
  - C: `gcc calculator.c -o calculator`.
  - Rust: `rustc math.rs` (or part of a crate).
  - Go: `go run strings.go`.
- No external libraries are needed; all code relies only on standard libraries.

## Key Flows
- **Queue operations**: Classic FIFO using Java’s `LinkedList`.
- **API calls**: Asynchronous fetch/await pattern with JSON parsing.
- **Password handling**: Hash with SHA‑256, then verify by re‑hashing and comparing digests.
- **Arithmetic (C)**: Simple functions with a sentinel error value for division by zero.
- **Math (Rust)**: Recursive factorial and efficient primality test.
- **String (Go)**: Unicode‑safe reversal and palindrome check.
- **Utility (Python)**: Basic arithmetic with exception‑based error handling for division by zero.

## Notable Interfaces & Error Handling
- **Error return vs. exception**:
  - `calculator.c` uses a sentinel (`-1.0f`) for division by zero.
  - `utils.py`, `Queue.java` throw exceptions/errors (`ValueError`, `NoSuchElementException`).
  - Others return boolean (`is_prime`, `verify_password`, `isPalindrome`) or assume valid input.
- **Mutability**: `Queue.java` mutates internal state; all other functions are pure or have no side effects.
- **Async**: JavaScript functions are `async` and return promises; all other modules are synchronous.
- **Language-specific conventions**: Go uses rune slices for Unicode, Rust features a recursive function with `u64`, Python uses docstrings, Java uses Javadoc, C uses Doxygen‑style comments, and JavaScript uses JSDoc.
```