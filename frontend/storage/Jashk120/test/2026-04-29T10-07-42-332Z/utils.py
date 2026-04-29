```python
def add(a, b):
    """
    Adds two numbers.

    Args:
        a (int or float): The first addend.
        b (int or float): The second addend.

    Returns:
        int or float: The sum of a and b.
    """
    return a + b

def multiply(a, b):
    """
    Multiplies two numbers.

    Args:
        a (int or float): The first factor.
        b (int or float): The second factor.

    Returns:
        int or float: The product of a and b.
    """
    return a * b

def divide(a, b):
    """
    Divides one number by another.

    Args:
        a (int or float): The dividend.
        b (int or float): The divisor.

    Returns:
        float: The quotient of a divided by b.

    Raises:
        ValueError: If b is zero, division is undefined.
    """
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```