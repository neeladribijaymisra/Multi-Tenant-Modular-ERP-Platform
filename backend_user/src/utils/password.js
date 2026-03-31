export function generatePassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#";
  let password = "";

  for (let index = 0; index < length; index += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  return password;
}
