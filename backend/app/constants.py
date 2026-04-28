EXTENSION_MAP: dict[str, str] = {
    ".py": "Python",
    ".ts": "TypeScript",
    ".tsx": "TypeScript React",
    ".js": "JavaScript",
    ".jsx": "JavaScript React",
    ".rs": "Rust",
    ".go": "Go",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".cs": "C#",
    ".rb": "Ruby",
    ".php": "PHP",
    ".swift": "Swift",
    ".kt": "Kotlin",
}

DOCSTRING_FORMATS: dict[str, str] = {
    "Python": (
        'def fetch_user(user_id: int) -> dict:\n'
        '    """\n'
        "    Fetches a user record from the database by ID.\n\n"
        "    Args:\n"
        "        user_id (int): The unique identifier of the user.\n\n"
        "    Returns:\n"
        "        dict: A dictionary containing user fields.\n\n"
        "    Raises:\n"
        "        ValueError: If user_id is not found.\n"
        '    """'
    ),
    "TypeScript": "/**\n * Fetches a user record from the database by ID.\n *\n * @param userId - The unique identifier of the user.\n * @returns A promise resolving to the user object.\n * @throws {Error} If the user is not found.\n */\nasync function fetchUser(userId: number): Promise<User> {",
    "TypeScript React": "/**\n * Fetches a user record from the database by ID.\n *\n * @param userId - The unique identifier of the user.\n * @returns A promise resolving to the user object.\n * @throws {Error} If the user is not found.\n */\nasync function fetchUser(userId: number): Promise<User> {",
    "JavaScript": "/**\n * Fetches a user record from the database by ID.\n *\n * @param userId - The unique identifier of the user.\n * @returns A promise resolving to the user object.\n * @throws {Error} If the user is not found.\n */\nasync function fetchUser(userId) {",
    "JavaScript React": "/**\n * Fetches a user record from the database by ID.\n *\n * @param userId - The unique identifier of the user.\n * @returns A promise resolving to the user object.\n * @throws {Error} If the user is not found.\n */\nasync function fetchUser(userId) {",
    "Rust": "/// Fetches a user record from the database by ID.\n///\n/// # Arguments\n/// * `user_id` - The unique identifier of the user.\n///\n/// # Returns\n/// * `Ok(User)` - The user record if found.\n/// * `Err(AppError)` - If the user does not exist.\nfn fetch_user(user_id: u32) -> Result<User, AppError> {",
    "Go": "// FetchUser retrieves a user record from the database by ID.\n// Returns an error if the user is not found.\nfunc FetchUser(userID int) (*User, error) {",
    "Java": "/**\n * Fetches a user record from the database by ID.\n *\n * @param userId the unique identifier of the user\n * @return the User object if found\n * @throws UserNotFoundException if no user exists with the given ID\n */\npublic User fetchUser(int userId) throws UserNotFoundException {",
    "C#": "/// <summary>\n/// Fetches a user record from the database by ID.\n/// </summary>\n/// <param name=\"userId\">The unique identifier of the user.</param>\n/// <returns>The User object if found.</returns>\n/// <exception cref=\"KeyNotFoundException\">Thrown if user does not exist.</exception>\npublic User FetchUser(int userId) {",
}

BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip", ".gz", ".tar", ".7z",
    ".mp3", ".mp4", ".mov", ".avi", ".woff", ".woff2", ".ttf", ".eot", ".otf", ".exe", ".dll",
    ".so", ".dylib", ".bin", ".class", ".jar", ".pyc",
}

MODEL_ID = "deepseek/deepseek-v4-flash"
MAX_TOKENS = 16000
