# CONTEXT.md

## Repository Overview

This repository contains a collection of small, self-contained utility modules implemented in multiple programming languages. The codebase demonstrates basic data structures, API client functions, cryptographic hashing, arithmetic operations, mathematical algorithms, and string manipulation. There is no overarching application or framework; each file is an independent module with its own specific purpose.

---

## Architecture & Module Breakdown

The repository is organized by language and utility domain:

| File | Language | Purpose |
|------|----------|---------|
| `Queue.java` | Java | FIFO queue implementation using `LinkedList<Integer>`. |
| `api.js` | JavaScript | Async functions for fetching and creating users via a REST API. |
| `auth.py` | Python | Password hashing and verification using SHA‑256. |
| `calculator.c` | C | Basic arithmetic functions: add, subtract, divide. |
| `math.rs` | Rust | Recursive factorial and primality testing functions. |
| `strings.go` | Go | String reversal and palindrome checking (case‑insensitive). |
| `utils.py` | Python | Simple arithmetic functions: add, multiply, divide (with zero‑division error). |

All modules are independent and rely only on standard libraries for their respective languages. No external dependencies are required beyond the language runtimes.

---

## Key Data Flows & Usage Patterns

1. **Java Queue**  
   - `enqueue(int)` → adds to tail; `dequeue()` → removes from head (FIFO); `isEmpty()` → checks emptiness.  
   - Typical usage: `Queue q = new Queue(); q.enqueue(10); int val = q.dequeue();`

2. **JavaScript API Client**  
   - `fetchUser(userId)` → GET `/api/users/{userId}` → returns promise resolving to user JSON.  
   - `createUser(name, email)` → POST `/api/users` with JSON body → returns created user.  
   - Both functions assume a running backend at the same origin.

3. **Python Auth Utilities**  
   - `hash_password(password)` → returns SHA‑256 hex digest.  
   - `verify_password(password, hashed)` → compares hash of `password` with `hashed`.

4. **C Calculator**  
   - `add`, `subtract`, `divide` operate on integers; `divide` returns `-1.0` on division by zero.  
   - All functions are pure, no side effects.

5. **Rust Math**  
   - `factorial(n)` → recursive, returns 1 for `n=0`.  
   - `is_prime(n)` → checks divisibility up to √n.

6. **Go String Utilities**  
   - `reverseString(s)` → returns reversed string (handles Unicode runes).  
   - `isPalindrome(s)` → case‑insensitive palindrome check using `reverseString`.

7. **Python General Math**  
   - `add`, `multiply`, `divide` work on `int` or `float`; `divide` raises `ValueError` on zero divisor.

---

## Notable Interfaces (Exported Functions / Classes)

| Module | Exported Entity | Signature / Description |
|--------|----------------|-------------------------|
| `Queue.java` | Class `Queue` | `void enqueue(int)`, `int dequeue()`, `boolean isEmpty()` |
| `api.js` | `fetchUser` | `async (userId: string) => Promise<object>` |
| `api.js` | `createUser` | `async (name: string, email: string) => Promise<object>` |
| `auth.py` | `hash_password` | `(password: str) -> str` |
| `auth.py` | `verify_password` | `(password: str, hashed: str) -> bool` |
| `calculator.c` | `add` | `int add(int a, int b)` |
| `calculator.c` | `subtract` | `int subtract(int a, int b)` |
| `calculator.c` | `divide` | `float divide(int a, int b)` |
| `math.rs` | `factorial` | `fn factorial(n: u64) -> u64` |
| `math.rs` | `is_prime` | `fn is_prime(n: u64) -> bool` |
| `strings.go` | `reverseString` | `func reverseString(s string) string` |
| `strings.go` | `isPalindrome` | `func isPalindrome(s string) bool` |
| `utils.py` | `add` | `(a, b) -> a + b` |
| `utils.py` | `multiply` | `(a, b) -> a * b` |
| `utils.py` | `divide` | `(a, b) -> float, raises ValueError` |

---

## Setup Assumptions

- **Runtime Requirements**:  
  - Java 8+ (for `Queue.java`)  
  - Node.js (for `api.js`)  
  - Python 3 (for `auth.py`, `utils.py`)  
  - C compiler (e.g., GCC) for `calculator.c`  
  - Rust compiler (`rustc`) and Cargo for `math.rs`  
  - Go 1.x for `strings.go`  

- No external libraries, package managers, or build tools are required beyond standard language toolchains.

- The `api.js` module assumes a REST API is available at the same origin (e.g., `/api/users`).

- The `calculator.c` `divide` function treats division by zero as an error case returning `-1.0`; callers should check for this sentinel value.

- All other functions have well‑defined behavior and do not require special environment configuration.