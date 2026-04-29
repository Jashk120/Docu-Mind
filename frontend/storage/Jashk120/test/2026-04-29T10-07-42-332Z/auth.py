```python
def hash_password(password):
    """
    Hashes a password using SHA-256.

    Args:
        password (str): The plain text password to hash.

    Returns:
        str: The hexadecimal digest of the SHA-256 hash of the password.
    """
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    """
    Verifies a plain text password against a stored hash.

    Compares the SHA-256 hash of the provided password with the given hashed value.

    Args:
        password (str): The plain text password to verify.
        hashed (str): The stored hash to compare against.

    Returns:
        bool: True if the password matches the hash, False otherwise.
    """
    return hash_password(password) == hashed
```