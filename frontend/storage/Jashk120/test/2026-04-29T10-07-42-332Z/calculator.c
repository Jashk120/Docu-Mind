```c
/**
 * @brief Adds two integers.
 * @param a First integer.
 * @param b Second integer.
 * @return Sum of a and b.
 */
int add(int a, int b) {
    return a + b;
}

/**
 * @brief Subtracts one integer from another.
 * @param a First integer.
 * @param b Second integer.
 * @return Result of a minus b.
 */
int subtract(int a, int b) {
    return a - b;
}

/**
 * @brief Divides two integers and returns a floating-point result.
 * @param a Dividend.
 * @param b Divisor.
 * @return Quotient as a float. Returns -1.0 if divisor is zero (error case).
 */
float divide(int a, int b) {
    if (b == 0) return -1;
    return (float)a / b;
}
```