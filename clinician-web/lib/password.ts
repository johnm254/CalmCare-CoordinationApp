export interface PasswordCheckResult {
  valid: boolean

  errors: string[]
}

/**
 * Evaluate a password against Duara security requirements.
 * Returns { valid: true, errors: [] } when all rules pass.
 */

export function checkPasswordStrength(password: string): PasswordCheckResult {
  const errors: string[] = []

  if (password.length < 12) {
    errors.push("At least 12 characters")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter")
  }

  if (!/[0-9]/.test(password)) {
    errors.push("At least one number")
  }

  if (!/[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(password)) {
    errors.push("At least one special character (!@#$%^&* etc.)")
  }

  return { valid: errors.length === 0, errors }
}
