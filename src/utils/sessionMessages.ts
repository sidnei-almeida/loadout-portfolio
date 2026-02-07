/**
 * Returns friendly messages for session expired
 */
export function getSessionExpiredMessage(): { title: string; message: string } {
  const messages = [
    {
      title: 'Session expired',
      message: "Looks like you've been offline too long. Please log in again to keep tracking your arsenal.",
    },
    {
      title: 'Session ended',
      message: 'Your session expired (this sometimes happens after reloads). Log in again to get back in the game.',
    },
    {
      title: 'Time to reconnect',
      message: "The server forgot who you are (reloads can do that). Log in again to pick up where you left off.",
    },
    {
      title: 'Reconnect needed',
      message: 'After a reload we need to reconnect you. Log in again—it only takes a moment.',
    },
    {
      title: 'Session timed out',
      message: "Your session disappeared. No worries—just log in again and continue from where you left off.",
    },
    {
      title: 'Connection lost',
      message: 'The connection was interrupted during the reload. Let\'s get you reconnected.',
    },
  ];

  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}
