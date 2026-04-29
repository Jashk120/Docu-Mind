```rust
/// Computes the factorial of a non-negative integer recursively.
///
/// # Arguments
/// * `n` - The non-negative integer to compute the factorial of.
///
/// # Returns
/// * `u64` - The factorial of `n` (n * (n-1) * ... * 1). Returns 1 for n = 0.
fn factorial(n: u64) -> u64 {
    if n == 0 {
        return 1;
    }
    n * factorial(n - 1)
}

/// Determines whether a given integer is a prime number.
///
/// # Arguments
/// * `n` - The integer to check for primality.
///
/// # Returns
/// * `bool` - `true` if `n` is prime, `false` otherwise.
fn is_prime(n: u64) -> bool {
    if n < 2 {
        return false;
    }
    for i in 2..=(n as f64).sqrt() as u64 {
        if n % i == 0 {
            return false;
        }
    }
    true
}
```