/**
 * Which addresses already have a live Clerk password-reset code in this page
 * session.
 *
 * Lives outside React so it survives component remounts (a useRef would reset
 * and mail a fresh code on every mount, invalidating the one the user is
 * holding). The login page's inline "Reset password" flow adds to this set
 * after it sends, so /reset-password does not immediately send a second code
 * for the same address.
 */
export const resetCodeSentByEmail = new Set<string>();
