# README.md

## Overview

This repository contains a collection of small, self-contained utility modules implemented in multiple programming languages. Each file provides basic operations ranging from data structures (queue), arithmetic, string manipulation, authentication, and API interaction. There are no inter-module dependencies; every file is independent and can be compiled or run individually.

## Features

- **Queue (Java)** – Integer queue using `LinkedList` with `enqueue`, `dequeue`, and `isEmpty`.
- **API Interaction (JavaScript)** – Asynchronous fetch for GET and POST against a REST users endpoint.
- **Authentication (Python)** – SHA-256 password hashing and verification.
- **Calculator (C)** – Basic arithmetic with sentinel error handling for division by zero.
- **Math (Rust)** – Recursive factorial and primality test via trial division.
- **Strings (Go)** – Unicode‑aware string reversal and case‑insensitive palindrome check.
- **Utilities (Python)** – Numeric operations (add, multiply, divide) with exception‑based error handling.

## File Structure

```
.
├── Queue.java
├── api.js
├── auth.py
├── calculator.c
├── math.rs
├── strings.go
└── utils.py
```

## Usage

Each file is standalone. Below are complete, runnable examples for every file.

### `Queue.java` (Java)

```java
import java.util.NoSuchElementException;

public class QueueExample {
    public static void main(String[] args) {
        Queue q = new Queue();
        q.enqueue(10);
        q.enqueue(20);
        System.out.println("Dequeued: " + q.dequeue());   // 10
        System.out.println("Is empty? " + q.isEmpty());   // false
        System.out.println("Dequeued: " + q.dequeue());   // 20
        System.out.println("Is empty? " + q.isEmpty());   // true
    }
}

// Required Queue class (same file or separate, shown here for completeness)
class Queue {
    private java.util.LinkedList<Integer> list = new java.util.LinkedList<>();
    public void enqueue(int value) { list.addLast(value); }
    public int dequeue() {
        if (list.isEmpty()) throw new NoSuchElementException("Queue is empty");
        return list.removeFirst();
    }
    public boolean isEmpty() { return list.isEmpty(); }
}
```

Compile and run:
```bash
javac QueueExample.java   # includes Queue
java QueueExample
```

### `api.js` (JavaScript)

```javascript
// Example usage (Node.js or browser)
async function main() {
    // Fetch a user (replace userId with valid id)
    const user = await fetchUser(1);
    console.log('User:', user);

    // Create a new user
    const newUser = await createUser('Alice', 'alice@example.com');
    console.log('Created:', newUser);
}

// Required functions (from api.js)
async function fetchUser(userId) {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
}

async function createUser(name, email) {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
    });
    return response.json();
}

main().catch(console.error);
```

Run (requires a running API server or replace URLs with a test endpoint):
```bash
node api.js
```

### `auth.py` (Python)

```python
from auth import hash_password, verify_password

# Example usage
pwd = "mySecret123"
hashed = hash_password(pwd)
print(f"Hash: {hashed}")

# Verify correct password
print("Correct password:", verify_password(pwd, hashed))       # True

# Verify wrong password
print("Wrong password:", verify_password("wrong", hashed))     # False
```

Assumes `auth.py` contains:
```python
import hashlib

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    return hash_password(password) == hashed
```

Run:
```bash
python auth.py   # or import in another script
```

### `calculator.c` (C)

```c
#include <stdio.h>
#include "calculator.h"   // or include directly

// Example main
int main() {
    int a = 10, b = 5;
    printf("add(%d, %d) = %d\n", a, b, add(a, b));
    printf("subtract(%d, %d) = %d\n", a, b, subtract(a, b));
    printf("divide(%d, %d) = %.2f\n", a, b, divide(a, b));

    // Division by zero
    printf("divide(%d, 0) = %.2f\n", a, divide(a, 0));   // -1.00
    return 0;
}

// Required functions (from calculator.c)
int add(int a, int b) { return a + b; }
int subtract(int a, int b) { return a - b; }
float divide(int a, int b) {
    if (b == 0) return -1.0f;
    return (float)a / b;
}
```

Compile and run:
```bash
gcc calculator.c -o calculator
./calculator
```

### `math.rs` (Rust)

```rust
// Example usage
fn main() {
    println!("factorial(5) = {}", factorial(5));       // 120
    println!("factorial(0) = {}", factorial(0));       // 1
    println!("is_prime(17) = {}", is_prime(17));       // true
    println!("is_prime(1) = {}", is_prime(1));         // false
}

// Required functions (from math.rs)
fn factorial(n: u64) -> u64 {
    if n == 0 { 1 } else { n * factorial(n - 1) }
}

fn is_prime(n: u64) -> bool {
    if n < 2 { return false; }
    let limit = (n as f64).sqrt() as u64;
    for i in 2..=limit {
        if n % i == 0 { return false; }
    }
    true
}
```

Compile and run:
```bash
rustc math.rs -o math
./math
```

### `strings.go` (Go)

```go
package main

import (
    "fmt"
    "strings"   // from strings.go
)

func main() {
    s := "Hello, 世界"
    fmt.Println("Original:", s)
    fmt.Println("Reversed:", reverseString(s))   // "界世 ,olleH"
    fmt.Println("Is palindrome (radar):", isPalindrome("radar"))     // true
    fmt.Println("Is palindrome (Hello):", isPalindrome("Hello"))     // false
}

// Required functions (from strings.go)
func reverseString(s string) string {
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    return string(runes)
}

func isPalindrome(s string) bool {
    s = strings.ToLower(s)
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        if runes[i] != runes[j] {
            return false
        }
    }
    return true
}
```

Run:
```bash
go run strings.go
```

### `utils.py` (Python)

```python
from utils import add, multiply, divide

# Example usage
print("add(3, 4) =", add(3, 4))                  # 7
print("multiply(3, 4) =", multiply(3, 4))        # 12
print("divide(10, 3) =", divide(10, 3))          # 3.333...

# Division by zero raises ValueError
try:
    print(divide(10, 0))
except ValueError as e:
    print("Error:", e)                           # Error: Division by zero
```

Assumes `utils.py` contains:
```python
def add(a, b):
    return a + b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        raise ValueError("Division by zero")
    return a / b
```

Run:
```bash
python utils.py   # or import in another script
```

## Setup

No build tools or package managers are required beyond the respective language compilers/interpreters. Each file can be compiled or run independently:

- **Java**: `javac Queue.java` (then `java Queue` with a main class).
- **JavaScript**: Import/require in Node.js or include in a browser.
- **Python**: `python <filename>.py` (or import into another script).
- **C**: `gcc calculator.c -o calculator`.
- **Rust**: `rustc math.rs` (or use as part of a crate).
- **Go**: `go run strings.go`.

All code relies only on standard libraries; no external dependencies are required.

## Notes

- **Error handling** differs per module: `calculator.c` returns a sentinel value (`-1.0f`) for division by zero; `utils.py` and `Queue.java` throw exceptions; other modules return booleans or assume valid input.
- **Mutability**: Only `Queue.java` mutates internal state; all other functions are pure.
- **Asynchronous**: JavaScript functions are `async` and return promises; all other modules are synchronous.
- **Unicode handling**: Go’s `reverseString` uses rune slices for proper Unicode support; others assume ASCII or simple characters.
- **Password hashing** uses SHA-256 (not appropriate for production security; for educational purposes only).