```c
/**
 * @brief Adds two integers.
 * 
 * @param a First integer operand.
 * @param b Second integer operand.
 * @return int The sum of a and b.
 */
int add(int a, int b) {
    return a + b;
}

/**
 * @brief Subtracts one integer from another.
 * 
 * @param a Minuend.
 * @param b Subtrahend.
 * @return int The result of a minus b.
 */
int subtract(int a, int b) {
    return a - b;
}

/**
 * @brief Divides one integer by another, returning a float.
 * 
 * @param a Dividend.
 * @param b Divisor. If zero, the function returns -1.0f.
 * @return float The result of a divided by b as a float, or -1.0f if b is zero.
 */
float divide(int a, int b) {
    if (b == 0) return -1;
    return (float)a / b;
}
```