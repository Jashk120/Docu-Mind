```python
def hash_password(password):
    """
    Hashes a plain-text password using SHA-256.

    Args:
        password (str): The password to hash.

    Returns:
        str: The hexadecimal digest of the SHA-256 hash.

    Note:
        The import of hashlib is kept inside the function for local scoping.
    """
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    """
    Verifies a plain-text password against a previously hashed password.

    Args:
        password (str): The plain-text password to verify.
        hashed (str): The previously hashed password (hexadecimal digest).

    Returns:
        bool: True if the password matches the hash, False otherwise.
    """
    return hash_password(password) == hashed
```