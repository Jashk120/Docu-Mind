```go
package main

import "strings"

// reverseString reverses the given string using runes to properly handle Unicode characters.
func reverseString(s string) string {
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    return string(runes)
}

// isPalindrome checks whether the given string is a palindrome, ignoring case.
// Returns true if the string reads the same forwards and backwards, false otherwise.
func isPalindrome(s string) bool {
    s = strings.ToLower(s)
    return s == reverseString(s)
}
```